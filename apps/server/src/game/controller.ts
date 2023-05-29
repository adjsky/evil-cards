import { serializeError } from "serialize-error"
import Emittery from "emittery"
import semverSatisfies from "semver/functions/satisfies.js"
import { omit } from "ramda"
import { logWithCtx } from "@evil-cards/ctx-log"
import { createInternalCtx } from "@evil-cards/ctx-log"
import { SessionCache } from "@evil-cards/keydb"

import { messageSchema } from "../lib/ws/receive.ts"
import stringify from "../lib/ws/stringify.ts"
import { ALIVE_CHECK_INTERVAL_MS } from "./constants.ts"
import {
  InSessionError,
  NoPlayerError,
  NoSessionError,
  SessionCacheSynchronizeError,
  SessionNotFoundError,
  VersionMismatchError
} from "./errors.ts"
import { isShuttingDown } from "../plugins/graceful-shutdown.ts"

import type { ISessionManager, ISession } from "./interfaces.ts"
import type {
  ControllerWebSocket,
  ControllerEvents,
  ServerEvent,
  Status,
  Vote,
  Configuration,
  Player,
  BroadcastCallback
} from "./types.ts"
import type { FastifyBaseLogger } from "fastify"
import type { ReqContext } from "@evil-cards/ctx-log"
import type { Client } from "@evil-cards/keydb"

export type ControllerConfig = {
  serverNumber: number
}

class Controller {
  private sessionManager: ISessionManager
  private events: ControllerEvents
  private _sessionCache: SessionCache
  private config: ControllerConfig
  private log: FastifyBaseLogger

  private versionMap: Map<string, string>
  private socketMap: Map<string, ControllerWebSocket>

  public get sessionCache() {
    return this._sessionCache
  }

  public constructor(
    sessionManager: ISessionManager,
    cacheClient: Client,
    config: ControllerConfig,
    log: FastifyBaseLogger
  ) {
    this.events = new Emittery()
    this.sessionManager = sessionManager
    this._sessionCache = new SessionCache(cacheClient)
    this.config = config
    this.log = log.child({ component: "game controller" })

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
    this.events.on("close", ({ ctx, socket }) => {
      try {
        this.disconnect(socket)
      } catch (error) {
        logWithCtx(ctx, this.log).error(error, "this.disconnect")
      }
    })
  }

  public handleConnection(ctx: ReqContext, socket: ControllerWebSocket) {
    socket.alive = true
    const interval = setInterval(() => {
      if (!socket.alive) {
        socket.terminate()
        clearInterval(interval)

        return
      }

      socket.alive = false
      socket.send(stringify({ type: "ping" }))
    }, ALIVE_CHECK_INTERVAL_MS)

    socket.on("message", async (rawData) => {
      try {
        const message = messageSchema.parse(JSON.parse(rawData.toString()))

        if (message.type == "pong") {
          socket.alive = true
        } else {
          await this.events.emit(
            message.type,
            "details" in message
              ? { ...message.details, socket, ctx }
              : { socket, ctx }
          )
        }
      } catch (error) {
        logWithCtx(ctx, this.log).error(error, "socket.on message")

        socket.send(
          stringify({
            type: "error",
            details: serializeError(error).message
          })
        )
      }
    })

    socket.on("close", () => {
      clearInterval(interval)
    })

    socket.on("error", (error) =>
      logWithCtx(ctx, this.log).error(error, "socket.on error")
    )
  }

  private async createSession({
    ctx,
    socket,
    nickname,
    avatarId,
    appVersion
  }: ServerEvent["createsession"]) {
    if (socket.session) {
      throw new InSessionError()
    }

    const session = this.sessionManager.create()
    socket.session = session

    const player = session.join(nickname, avatarId)
    socket.player = player

    const isSynchronized = await this.syncSessionCache(ctx, session)
    if (!isSynchronized) {
      this.handleSessionEnd(session)

      throw new SessionCacheSynchronizeError()
    }

    this.versionMap.set(session.id, appVersion)
    this.socketMap.set(player.id, socket)

    this.setupSessionListeners(ctx, session)
    session.events.on("sessionend", () => this.handleSessionEnd(session))

    socket.on("close", () => {
      this.events.emit("close", { socket, ctx })
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
    ctx,
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
      this.events.emit("close", { socket, ctx })
    })

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
            votingEndsAt: session.getTimeoutDate("voting")?.getTime() ?? null,
            configuration: session.configuration,
            votes: session.votes
          }
        }
      })
    )
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

    session.leave(player.id)

    const kickedPlayerSocket = this.socketMap.get(player.id)
    if (kickedPlayerSocket) {
      kickedPlayerSocket.send(
        stringify({
          type: "kicked"
        })
      )

      kickedPlayerSocket.session = null
      kickedPlayerSocket.player = null

      this.socketMap.delete(player.id)
    }
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

  private setupSessionListeners(ctx: ReqContext, session: ISession) {
    const handleStatusChange = (status: Status) => {
      switch (status) {
        case "starting": {
          this.syncSessionCache(ctx, session)

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

            return {
              type: "votingstart",
              details: {
                changedState: {
                  deck: player.deck,
                  players,
                  redCard: session.redCard,
                  status,
                  votes: session.votes,
                  votingEndsAt:
                    session.getTimeoutDate("voting")?.getTime() ?? null
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
          this.syncSessionCache(ctx, session)

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
      this.syncSessionCache(ctx, session)

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
        this.syncSessionCache(ctx, session)
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
        this.syncSessionCache(ctx, session)
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

  private async syncSessionCache(ctx: ReqContext, session: ISession) {
    if (isShuttingDown()) {
      return false
    }

    const host = session.players.find((player) => player.host)

    let hostNickname = host?.nickname
    let hostAvatarId = host?.avatarId

    if (!hostNickname || !hostAvatarId) {
      const prevCachedSession = await this._sessionCache.get(ctx, session.id)

      if (prevCachedSession.none) {
        return false
      }

      hostNickname = prevCachedSession.unwrap().hostNickname
      hostAvatarId = prevCachedSession.unwrap().hostAvatarId
    }

    return this._sessionCache.set(ctx, {
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
    const ctx = createInternalCtx()

    this.log.info({ sessionId: session.id }, "handling session end")

    session.events.clearListeners()

    this._sessionCache.del(ctx, session.id)

    this.versionMap.delete(session.id)
    this.sessionManager.delete(session.id)
  }

  public async cleanSessionCache() {
    this.log.info("cleaning session cache")

    const ctx = createInternalCtx()

    await Promise.all(
      this.sessionManager
        .getAll()
        .map((session) => this._sessionCache.del(ctx, session.id))
    )

    this.log.info("successfully cleaned session cache")
  }
}

export default Controller
