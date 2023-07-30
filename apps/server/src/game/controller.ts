import Emittery from "emittery"
import { nanoid } from "nanoid"
import { omit } from "ramda"
import semverSatisfies from "semver/functions/satisfies.js"
import { serializeError } from "serialize-error"

import { log } from "@evil-cards/core/fastify"
import { getFastifyInstance } from "@evil-cards/core/fastify"
import { SessionCache } from "@evil-cards/core/keydb"

import { messageSchema } from "../lib/ws/receive.ts"
import stringify from "../lib/ws/stringify.ts"
import {
  ACTIVITY_CHECK_INTERVAL_MS,
  ALIVE_CHECK_INTERVAL_MS,
  CHAT_MESSAGE_ID_SIZE,
  CUSTOM_WS_CLOSE_CODE,
  CUSTOM_WS_CLOSE_REASON
} from "./constants.ts"
import {
  GameError,
  InSessionError,
  InvalidSessionStateError,
  NoPlayerError,
  NoSessionError,
  SessionCacheSynchronizeError,
  SessionNotFoundError,
  VersionMismatchError
} from "./errors.ts"

import type { ISession, ISessionManager } from "./interfaces.ts"
import type {
  BroadcastCallback,
  Configuration,
  ControllerEvents,
  ControllerWebSocket,
  Player,
  ServerEvent,
  Status,
  Vote
} from "./types.ts"
import type { RedisClient } from "@evil-cards/core/keydb"

export type ControllerConfig = {
  serverNumber: number
}

class Controller {
  private sessionManager: ISessionManager
  private events: ControllerEvents
  private _sessionCache: SessionCache
  private config: ControllerConfig

  private versionMap: Map<string, string>
  private socketMap: Map<string, ControllerWebSocket>

  public get sessionCache() {
    return this._sessionCache
  }

  public constructor(
    sessionManager: ISessionManager,
    redisClient: RedisClient,
    config: ControllerConfig
  ) {
    this.events = new Emittery()
    this.sessionManager = sessionManager
    this._sessionCache = new SessionCache(redisClient)
    this.config = config

    this.versionMap = new Map()
    this.socketMap = new Map()

    this.events.on("createsession", this.createSession.bind(this))
    this.events.on("joinsession", this.joinSession.bind(this))

    this.events.on("updateconfiguration", this.updateConfiguration.bind(this))
    this.events.on("choose", this.choose.bind(this))
    this.events.on("choosewinner", this.chooseWinner.bind(this))
    this.events.on("startgame", this.startGame.bind(this))
    this.events.on("vote", this.vote.bind(this))
    this.events.on("discardcards", this.discardCards.bind(this))
    this.events.on("kickplayer", this.kick.bind(this))
    this.events.on("chat", this.chat.bind(this))
    this.events.on("close", ({ socket }) => {
      /**
       * Here we have to check if the server is shutting down
       * to prevent UB (trying to sync cache or writing to a closed redis instance)
       * because when shutting down the following things happen:
       * 1) the server is being closed (all connections terminate)
       * 2) the cleanSessionCache method is called (all sessions are cleared)
       * 3) the redis instance is being closed
       */
      if (getFastifyInstance()?.isShuttingDown()) {
        return
      }

      try {
        this.disconnect(socket)
      } catch (error) {
        if (error instanceof GameError) {
          return
        }

        log.error(error, "Failed to disconnect controller socket")
      }
    })
  }

  public handleConnection(socket: ControllerWebSocket) {
    socket.alive = true

    const aliveInterval = setInterval(() => {
      if (!socket.alive) {
        socket.terminate()
        clearInterval(aliveInterval)

        return
      }

      socket.alive = false
      socket.send(stringify({ type: "ping" }))
    }, ALIVE_CHECK_INTERVAL_MS)

    const activityInterval = setInterval(() => {
      if (!socket.active) {
        socket.close(CUSTOM_WS_CLOSE_CODE, CUSTOM_WS_CLOSE_REASON.INACTIVE)
        clearInterval(activityInterval)

        return
      }

      socket.active = false
    }, ACTIVITY_CHECK_INTERVAL_MS)

    socket.on("message", async (rawData) => {
      try {
        const message = messageSchema.parse(JSON.parse(rawData.toString()))

        if (message.type == "pong") {
          socket.alive = true
        } else {
          socket.active = true
          await this.events.emit(
            message.type,
            "details" in message ? { ...message.details, socket } : { socket }
          )
        }
      } catch (error) {
        if (!(error instanceof GameError)) {
          log.error(error, "Failed to process controller socket message")
        }

        socket.send(
          stringify({
            type: "error",
            details: serializeError(error).message
          })
        )
      }
    })

    socket.on("close", () => {
      clearInterval(aliveInterval)
      clearInterval(activityInterval)
    })

    socket.on("error", (error) =>
      log.error(error, "Received a controller socket error")
    )
  }

  private async createSession({
    socket,
    nickname,
    avatarId,
    appVersion
  }: ServerEvent["createsession"]) {
    if (socket.session) {
      throw new InSessionError()
    }

    const session = this.sessionManager.create()
    if (session.status != "waiting") {
      throw new InvalidSessionStateError()
    }
    socket.session = session

    const player = session.join(nickname, avatarId)
    socket.player = player

    /**
     * Here we have to check whether sync was successful or not
     * because if a newly created session stays out of sync with the cache
     * nobody won't be able to connect to this session
     */
    const isSynchronized = await this.syncSessionCache(session)
    if (!isSynchronized) {
      socket.session = null
      socket.player = null

      this.handleSessionEnd(session)

      throw new SessionCacheSynchronizeError()
    }

    this.versionMap.set(session.id, appVersion)
    this.socketMap.set(player.id, socket)

    this.setupSessionListeners(session)
    session.events.on("sessionend", () => this.handleSessionEnd(session))

    socket.on("close", () => {
      this.events.emit("close", { socket })
    })

    socket.send(
      stringify({
        type: "create",
        details: {
          changedState: {
            id: session.id,
            status: session.status,
            playerId: player.id,
            players: this.getNormalizedPlayers(session.players),
            configuration: session.configuration
          }
        }
      })
    )
  }

  private joinSession({
    socket,
    nickname,
    avatarId,
    sessionId,
    appVersion
  }: ServerEvent["joinsession"]) {
    if (socket.session) {
      throw new InSessionError()
    }

    const session = this.sessionManager.get(sessionId)
    if (!session) {
      throw new SessionNotFoundError()
    }

    const sessionVersion = this.versionMap.get(session.id)
    if (sessionVersion && !semverSatisfies(appVersion, `^${sessionVersion}`)) {
      throw new VersionMismatchError()
    }

    const player = session.join(nickname, avatarId)

    socket.session = session
    socket.player = player

    this.socketMap.set(player.id, socket)

    socket.on("close", () => {
      this.events.emit("close", { socket })
    })

    if (
      session.status == "waiting" ||
      session.status == "starting" ||
      session.status == "end"
    ) {
      socket.send(
        stringify({
          type: "join",
          details: {
            changedState: {
              id: session.id,
              status: session.status,
              playerId: player.id,
              players: this.getNormalizedPlayers(session.players),
              configuration: session.configuration
            }
          }
        })
      )
    } else {
      const votingEndsAt = session.getTimeoutDate("voting")?.getTime()

      if (!session.redCard || !votingEndsAt) {
        throw new InvalidSessionStateError()
      }

      socket.send(
        stringify({
          type: "join",
          details: {
            changedState: {
              id: session.id,
              status: session.status,
              playerId: player.id,
              players: this.getNormalizedPlayers(session.players),
              deck: player.deck,
              redCard: session.redCard,
              votingEndsAt,
              configuration: session.configuration,
              votes: session.votes
            }
          }
        })
      )
    }
  }

  private kick({ playerId, socket }: ServerEvent["kickplayer"]) {
    const session = socket.session
    if (!session) {
      throw new NoSessionError()
    }

    const player = session.players.find((player) => player.id == playerId)
    if (!player) {
      throw new NoPlayerError()
    }

    const kickSocket = this.socketMap.get(player.id)
    kickSocket?.close(CUSTOM_WS_CLOSE_CODE, CUSTOM_WS_CLOSE_REASON.KICK)
  }

  private disconnect(socket: ControllerWebSocket) {
    const session = socket.session
    if (!session) {
      throw new NoSessionError()
    }

    const player = socket.player
    if (!player) {
      throw new NoPlayerError()
    }

    session.leave(player.id)

    socket.session = null
    socket.player = null

    this.socketMap.delete(player.id)
  }

  private updateConfiguration({
    socket,
    ...configuration
  }: ServerEvent["updateconfiguration"]) {
    const session = socket.session
    if (!session) {
      throw new NoSessionError()
    }

    const player = socket.player
    if (!player) {
      throw new NoPlayerError()
    }

    session.updateConfiguration(player.id, configuration)
  }

  private startGame({ socket }: ServerEvent["startgame"]) {
    const session = socket.session
    if (!session) {
      throw new NoSessionError()
    }

    const player = socket.player
    if (!player) {
      throw new NoPlayerError()
    }

    session.startGame(player.id)
  }

  private vote({ socket, cardId }: ServerEvent["vote"]) {
    const session = socket.session
    if (!session) {
      throw new NoSessionError()
    }

    const player = socket.player
    if (!player) {
      throw new NoPlayerError()
    }

    session.vote(player.id, cardId)
  }

  private choose({ socket, playerId }: ServerEvent["choose"]) {
    const session = socket.session
    if (!session) {
      throw new NoSessionError()
    }

    const player = socket.player
    if (!player) {
      throw new NoPlayerError()
    }

    session.choose(player.id, playerId)
  }

  private chooseWinner({ socket, playerId }: ServerEvent["choosewinner"]) {
    const session = socket.session
    if (!session) {
      throw new NoSessionError()
    }

    const player = socket.player
    if (!player) {
      throw new NoPlayerError()
    }

    session.chooseWinner(player.id, playerId)
  }

  private discardCards({ socket }: ServerEvent["discardcards"]) {
    const session = socket.session
    if (!session) {
      throw new NoSessionError()
    }

    const player = socket.player
    if (!player) {
      throw new NoPlayerError()
    }

    session.discardCards(player.id)
  }

  private chat({ socket, message }: ServerEvent["chat"]) {
    const session = socket.session
    if (!session) {
      throw new NoSessionError()
    }

    const player = socket.player
    if (!player) {
      throw new NoPlayerError()
    }

    this.broadcast(session, () => ({
      type: "chat",
      details: {
        message,
        id: nanoid(CHAT_MESSAGE_ID_SIZE),
        avatarId: player.avatarId,
        nickname: player.nickname
      }
    }))
  }

  private setupSessionListeners(session: ISession) {
    const handleStatusChange = (status: Status) => {
      switch (status) {
        case "starting": {
          this.syncSessionCache(session)

          this.broadcast(session, () => ({
            type: "gamestart",
            details: {
              changedState: {
                status
              }
            }
          }))

          break
        }

        case "voting": {
          this.broadcast(session, (players, player) => {
            if (!session.redCard) {
              return
            }

            const votingEndsAt = session.getTimeoutDate("voting")?.getTime()

            if (!votingEndsAt) {
              return {
                type: "error",
                details: new InvalidSessionStateError().message
              }
            }

            return {
              type: "votingstart",
              details: {
                changedState: {
                  deck: player.deck,
                  players,
                  redCard: session.redCard,
                  status,
                  votes: session.votes,
                  votingEndsAt
                }
              }
            }
          })

          break
        }

        case "choosing": {
          this.broadcast(session, (_, player) => ({
            type: "choosingstart",
            details: {
              changedState: {
                status,
                votes: session.votes,
                deck: player.deck
              }
            }
          }))

          break
        }

        case "choosingwinner": {
          this.broadcast(session, () => ({
            type: "choosingwinnerstart",
            details: { changedState: { status } }
          }))

          break
        }

        case "winnercardview": {
          this.broadcast(session, () => ({
            type: "winnercardview",
            details: {
              changedState: {
                status
              }
            }
          }))

          break
        }

        case "end": {
          this.syncSessionCache(session)

          this.broadcast(session, (players) => ({
            type: "gameend",
            details: {
              changedState: {
                status,
                players
              }
            }
          }))

          break
        }
      }
    }

    const handleChoose = (vote: Vote) => {
      this.broadcast(session, () => ({
        type: "choose",
        details: {
          changedState: { votes: session.votes },
          choosedPlayerId: vote.playerId
        }
      }))
    }

    const handleChooseWinner = () => {
      this.broadcast(session, (players) => ({
        type: "choosewinner",
        details: {
          changedState: {
            votes: session.votes,
            players
          }
        }
      }))
    }

    const handleVote = () => {
      this.broadcast(session, (players, player) => ({
        type: "vote",
        details: {
          changedState: {
            votes: session.votes,
            players,
            deck: player.deck
          }
        }
      }))
    }

    const handleConfigurationChange = (configuration: Configuration) => {
      this.syncSessionCache(session)

      this.broadcast(session, () => ({
        type: "configurationchange",
        details: {
          changedState: {
            configuration
          }
        }
      }))
    }

    const handleJoin = (joinedPlayer: Player) => {
      if (session.isWaiting()) {
        this.syncSessionCache(session)
      }

      this.broadcast(session, (players, player) => {
        if (joinedPlayer.id == player.id) {
          return
        }

        return {
          type: "playerjoin",
          details: {
            changedState: {
              players
            }
          }
        }
      })
    }

    const handleLeave = () => {
      if (session.isWaiting()) {
        this.syncSessionCache(session)
      }

      this.broadcast(session, (players) => ({
        type: "playerleave",
        details: {
          changedState: {
            players
          }
        }
      }))
    }

    const handleCardsDiscard = (discardedCardsPlayer: Player) => {
      this.broadcast(session, (players, player) => ({
        type: "discardcards",
        details: {
          changedState: {
            players,
            deck:
              discardedCardsPlayer.id == player.id
                ? discardedCardsPlayer.deck
                : undefined
          }
        }
      }))
    }

    session.events.on("statuschange", handleStatusChange)
    session.events.on("vote", handleVote)
    session.events.on("choose", handleChoose)
    session.events.on("choosewinner", handleChooseWinner)
    session.events.on("configurationchange", handleConfigurationChange)
    session.events.on("join", handleJoin)
    session.events.on("leave", handleLeave)
    session.events.on("cardsdiscard", handleCardsDiscard)
  }

  private broadcast(session: ISession, callback: BroadcastCallback) {
    const players = this.getNormalizedPlayers(session.players)

    session.players.forEach((player) => {
      if (player.disconnected) {
        return
      }

      const result = callback(players, player)
      if (!result) {
        return
      }

      this.socketMap.get(player.id)?.send(stringify(result))
    })
  }

  private getNormalizedPlayers(players: Player[]) {
    return players.map((player) => omit(["leaveTimeout", "deck"], player))
  }

  private async syncSessionCache(session: ISession) {
    const host = session.players.find((player) => player.host)

    let hostNickname = host?.nickname
    let hostAvatarId = host?.avatarId

    if (!hostNickname || !hostAvatarId) {
      const prevCachedSession = await this._sessionCache.get(session.id)

      if (!prevCachedSession) {
        return false
      }

      hostNickname = prevCachedSession.hostNickname
      hostAvatarId = prevCachedSession.hostAvatarId
    }

    return this._sessionCache.set({
      id: session.id,
      players: session.players.length,
      playing: session.isPlaying(),
      server: this.config.serverNumber,
      adultOnly: session.configuration.version18Plus,
      hostNickname,
      hostAvatarId,
      speed:
        session.configuration.votingDurationSeconds == 30
          ? "fast"
          : session.configuration.votingDurationSeconds == 60
          ? "normal"
          : "slow",
      public: session.configuration.public
    })
  }

  public handleSessionEnd(session: ISession) {
    log.info({ sessionId: session.id }, "Starting session cleanup")

    session.events.clearListeners()

    this._sessionCache.del(session.id)

    this.versionMap.delete(session.id)
    this.sessionManager.delete(session.id)
  }

  public async cleanSessionCache() {
    log.info("Starting session cache cleanup")

    await Promise.all(
      this.sessionManager
        .getAll()
        .map((session) => this._sessionCache.del(session.id))
    )

    log.info("Finished session cache cleanup")
  }
}

export default Controller
