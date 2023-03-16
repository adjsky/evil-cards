import { serializeError } from "serialize-error"
import Emittery from "emittery"

import { messageSchema } from "../lib/ws/receive"
import stringify from "../lib/ws/stringify"
import {
  ALIVE_CHECK_INTERVAL_MS,
  SESSION_REDIS_EXPIRE_SECONDS
} from "./constants"
import {
  InSessionError,
  NoPlayerError,
  NoSessionError,
  SessionNotFoundError
} from "./errors"
import omit from "../functions/omit"

import type { WebSocket } from "ws"
import type { ISessionManager, ISession } from "./intefaces"
import type {
  ControllerEvents,
  ServerEvent,
  Status,
  Vote,
  Configuration,
  Player
} from "./types"
import type { RedisClientType } from "redis"
import type { FastifyBaseLogger } from "fastify"

export type ControllerConfig = {
  serverNumber: string
}

class Controller {
  private sessionManager: ISessionManager
  private events: ControllerEvents
  private redis: RedisClientType
  private config: ControllerConfig
  private log: FastifyBaseLogger

  public constructor(
    sessionManager: ISessionManager,
    redis: RedisClientType,
    config: ControllerConfig,
    log: FastifyBaseLogger
  ) {
    this.events = new Emittery()
    this.sessionManager = sessionManager
    this.redis = redis
    this.config = config
    this.log = log.child({ component: "game controller" })

    this.events.on("createsession", this.createSession.bind(this))
    this.events.on("joinsession", this.joinSession.bind(this))

    this.events.on("updateconfiguration", this.updateConfiguration.bind(this))
    this.events.on("choose", this.choose.bind(this))
    this.events.on("choosewinner", this.chooseWinner.bind(this))
    this.events.on("startgame", this.startGame.bind(this))
    this.events.on("vote", this.vote.bind(this))
    this.events.on("lostconnection", ({ socket }) => this.disconnect(socket))
  }

  public handleConnection(socket: WebSocket) {
    socket.alive = true
    const interval = setInterval(async () => {
      if (!socket.alive) {
        try {
          await this.events.emit("lostconnection", { socket })
        } catch (error) {
          this.log.error(error, "emit lostconnection")
        }

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
            "details" in message ? { ...message.details, socket } : { socket }
          )
        }
      } catch (error) {
        this.log.error(error, "socket.on message")

        if (socket.OPEN) {
          socket.send(
            stringify({
              type: "error",
              details: serializeError(error).message
            })
          )
        }
      }
    })
  }

  private async createSession({
    socket,
    nickname,
    avatarId
  }: ServerEvent["createsession"]) {
    if (socket.session) {
      throw new InSessionError()
    }

    const session = this.sessionManager.create()
    const player = session.join(socket, nickname, avatarId, true)

    await this.addSessionToRedis(session.id)

    this.setupSessionListeners(session)

    socket.session = session
    socket.player = player

    session.events.on("sessionend", () => {
      session.events.clearListeners()
      this.delSessionFromRedis(session.id)
      this.sessionManager.delete(session.id)
    })

    socket.on("close", () => {
      this.disconnect(socket)
    })

    socket.send(
      stringify({
        type: "create",
        details: {
          changedState: {
            id: session.id,
            status: session.status,
            playerId: player.id,
            players: session.players.map((player) =>
              omit(player, ["sender", "deck"])
            ),
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
    sessionId
  }: ServerEvent["joinsession"]) {
    if (socket.session) {
      throw new InSessionError()
    }

    const session = this.sessionManager.get(sessionId)

    if (!session) {
      throw new SessionNotFoundError()
    }

    const player = session.join(socket, nickname, avatarId, false)

    socket.session = session
    socket.player = player

    socket.on("close", () => {
      this.disconnect(socket)
    })

    socket.send(
      stringify({
        type: "join",
        details: {
          changedState: {
            id: session.id,
            status: session.status,
            playerId: player.id,
            players: session.players.map((player) =>
              omit(player, ["sender", "deck"])
            ),
            deck: player.deck,
            redCard: session.redCard,
            votingEndsAt: session.getTimeoutDate("voting")?.getTime() ?? null,
            configuration: session.configuration
          }
        }
      })
    )
  }

  private disconnect(socket: WebSocket) {
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

  private vote({ socket, text }: ServerEvent["vote"]) {
    const session = socket.session

    if (!session) {
      throw new NoSessionError()
    }

    const player = socket.player

    if (!player) {
      throw new NoPlayerError()
    }

    session.vote(player.id, text)
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

  private setupSessionListeners(session: ISession) {
    const handleStatusChange = (status: Status) => {
      switch (status) {
        case "starting": {
          session.players.forEach((player) => {
            if (player.disconnected) {
              return
            }

            player.sender.send(
              stringify({
                type: "gamestart",
                details: {
                  changedState: {
                    status
                  }
                }
              })
            )
          })

          break
        }

        case "voting": {
          session.players.forEach((player) => {
            if (player.disconnected || !session.redCard) {
              return
            }

            player.sender.send(
              stringify({
                type: "votingstart",
                details: {
                  changedState: {
                    deck: player.deck,
                    players: session.players.map((player) =>
                      omit(player, ["sender", "deck"])
                    ),
                    redCard: session.redCard,
                    status,
                    votes: session.votes,
                    votingEndsAt:
                      session.getTimeoutDate("voting")?.getTime() ?? null
                  }
                }
              })
            )
          })

          break
        }

        case "choosing": {
          session.players.forEach((player) => {
            if (player.disconnected) {
              return
            }

            player.sender.send(
              stringify({
                type: "choosingstart",
                details: {
                  changedState: {
                    status,
                    votes: session.votes,
                    deck: player.deck
                  }
                }
              })
            )
          })

          break
        }

        case "choosingwinner": {
          session.players.forEach((player) => {
            if (player.disconnected) {
              return
            }

            player.sender.send(
              stringify({
                type: "choosingwinnerstart",
                details: { changedState: { status } }
              })
            )
          })

          break
        }

        case "winnercardview": {
          session.players.forEach((player) => {
            if (player.disconnected) {
              return
            }

            player.sender.send(
              stringify({
                type: "winnercardview",
                details: {
                  changedState: {
                    status
                  }
                }
              })
            )
          })

          break
        }

        case "end": {
          session.players.forEach((player) => {
            if (player.disconnected) {
              return
            }

            player.sender.send(
              stringify({
                type: "gameend",
                details: {
                  changedState: {
                    status,
                    players: session.players.map((player) =>
                      omit(player, ["sender", "deck"])
                    )
                  }
                }
              })
            )
          })

          break
        }
      }
    }

    const handleChoose = (vote: Vote) => {
      session.players.forEach((player) => {
        if (player.disconnected) {
          return
        }

        player.sender.send(
          stringify({
            type: "choose",
            details: {
              changedState: { votes: session.votes },
              choosedPlayerId: vote.playerId
            }
          })
        )
      })
    }

    const handleChooseWinner = () => {
      session.players.forEach((player) => {
        if (player.disconnected) {
          return
        }

        player.sender.send(
          stringify({
            type: "choosewinner",
            details: {
              changedState: {
                votes: session.votes,
                players: session.players.map((player) =>
                  omit(player, ["sender", "deck"])
                )
              }
            }
          })
        )
      })
    }

    const handleVote = () => {
      session.players.forEach((player) => {
        if (player.disconnected) {
          return
        }

        player.sender.send(
          stringify({
            type: "vote",
            details: {
              changedState: {
                votes: session.votes,
                players: session.players.map((player) =>
                  omit(player, ["sender", "deck"])
                ),
                deck: player.deck
              }
            }
          })
        )
      })
    }

    const handleConfigurationChange = (configuration: Configuration) => {
      session.players.forEach((player) => {
        if (player.disconnected) {
          return
        }

        player.sender.send(
          stringify({
            type: "configurationchange",
            details: {
              changedState: {
                configuration
              }
            }
          })
        )
      })
    }

    const handleJoin = (joinedPlayer: Player) => {
      session.players.forEach((player) => {
        if (player.disconnected || joinedPlayer.id == player.id) {
          return
        }

        player.sender.send(
          stringify({
            type: "playerjoin",
            details: {
              changedState: {
                players: session.players.map((player) =>
                  omit(player, ["sender", "deck"])
                )
              }
            }
          })
        )
      })
    }

    const handleLeave = () => {
      session.players.forEach((player) => {
        if (player.disconnected) {
          return
        }

        player.sender.send(
          stringify({
            type: "playerleave",
            details: {
              changedState: {
                players: session.players.map((player) =>
                  omit(player, ["sender", "deck"])
                )
              }
            }
          })
        )
      })
    }

    session.events.on("statuschange", handleStatusChange)
    session.events.on("vote", handleVote)
    session.events.on("choose", handleChoose)
    session.events.on("choosewinner", handleChooseWinner)
    session.events.on("configurationchange", handleConfigurationChange)
    session.events.on("join", handleJoin)
    session.events.on("leave", handleLeave)
  }

  private async addSessionToRedis(sessionId: string) {
    try {
      const result = await this.redis.set(
        `sessionserver:${sessionId}`,
        this.config.serverNumber,
        {
          EX: SESSION_REDIS_EXPIRE_SECONDS
        }
      )

      this.log.info(
        { result, sessionId, serverNumber: this.config.serverNumber },
        "redis.set sessionserver"
      )
    } catch (error) {
      this.log.error(
        { err: error, sessionId, serverNumber: this.config.serverNumber },
        "redis.set sessionserver"
      )
    }
  }

  private async delSessionFromRedis(sessionId: string) {
    try {
      const result = await this.redis.del(`sessionserver:${sessionId}`)

      this.log.info(
        { result, sessionId, serverNumber: this.config.serverNumber },
        "redis.del sessionserver"
      )
    } catch (error) {
      this.log.error(
        { err: error, sessionId, serverNumber: this.config.serverNumber },
        "redis.del sessionserver"
      )
    }
  }
}

export default Controller
