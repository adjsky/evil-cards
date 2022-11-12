import stringify from "../lib/ws/stringify"
import Controller from "./controller"
import Session from "./session"

import type { ServerEvent } from "./types"
import type { User } from "../lib/ws/send"
import type { WebSocket } from "ws"

class Game {
  private sessions: Map<string, Session>
  public controller: Controller

  constructor() {
    this.sessions = new Map()
    this.controller = new Controller()

    this.controller.eventBus.on("createsession", this.createSession.bind(this))
    this.controller.eventBus.on("joinsession", this.joinSession.bind(this))

    this.controller.eventBus.on("choose", this.choose.bind(this))
    this.controller.eventBus.on("choosebest", this.chooseBest.bind(this))
    this.controller.eventBus.on("startgame", this.startGame.bind(this))
    this.controller.eventBus.on("vote", this.vote.bind(this))
    this.controller.eventBus.on("lostconnection", ({ socket }) =>
      this.disconnectUser(socket)
    )
  }

  private disconnectUser(socket: WebSocket) {
    const session = socket.session
    const user = socket.user
    if (!session || !user) {
      return
    }

    session.disconnectUser(user, {
      onSessionEnd: () => this.onSessionEnd(session),
      onDisconnect(anyActivePlayers) {
        if (!anyActivePlayers) {
          return
        }

        for (const user of session.users) {
          session.getUserSender(user).send(
            stringify({
              type: "userdisconnected",
              details: { users: session.users }
            })
          )
        }
      }
    })

    socket.user = null
    socket.session = null
  }

  private createSession({
    socket,
    username,
    avatarId
  }: ServerEvent["createsession"]) {
    const session = new Session({ votingDuration: 60 })
    const user = session.addUser(socket, username, avatarId, true)

    this.sessions.set(session.id, session)
    socket.session = session
    socket.user = user

    socket.send(
      stringify({
        type: "created",
        details: {
          id: session.id,
          status: session.status,
          users: session.users,
          userId: user.id
        }
      })
    )

    socket.on("close", () => this.disconnectUser(socket))
  }

  private joinSession({
    sessionId,
    socket,
    username,
    avatarId
  }: ServerEvent["joinsession"]) {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error("session not found")
    }
    const waitingState = session.status == "waiting" || session.status == "end"

    const previousUser = session.users.find((user) => user.username == username)
    let newUser: User
    if (previousUser && !waitingState) {
      session.reconnectUser(socket, previousUser, avatarId)
      newUser = previousUser
    } else {
      if (!waitingState) {
        throw new Error("game is started already")
      }
      if (session.users.findIndex((user) => user.username == username) != -1) {
        throw new Error("nickname is taken")
      }

      const user = session.addUser(socket, username, avatarId, false)
      newUser = user
    }

    socket.session = session
    socket.user = newUser

    session.users.forEach((user) => {
      const userSocket = session.getUserSender(user)

      if (user.id == newUser.id) {
        userSocket.send(
          stringify({
            type: "joined",
            details: {
              id: session.id,
              status: session.status,
              userId: newUser.id,
              users: session.users,
              whiteCards: session.getUserWhitecards(user),
              redCard: session.redCard,
              votingEndsAt: session.getTimeoutDate("voting")?.getTime() ?? null
            }
          })
        )
      } else {
        userSocket.send(
          stringify({
            type: "userjoined",
            details: {
              users: session.users
            }
          })
        )
      }
    })

    socket.on("close", () => this.disconnectUser(socket))
  }

  private vote({ socket, text }: ServerEvent["vote"]) {
    const session = socket.session
    if (!session) {
      throw new Error("no session")
    }
    const user = socket.user
    if (!user) {
      throw new Error("no user")
    }

    if (user.master) {
      throw new Error("master can't vote")
    }
    if (session.status != "voting") {
      throw new Error("you can't vote now")
    }
    if (!session.getUserWhitecards(user).includes(text)) {
      throw new Error("you have no such card")
    }
    if (user.voted) {
      throw new Error("you have voted already")
    }

    session.vote(user, text, {
      onVote() {
        for (const user of session.users) {
          session.getUserSender(user).send(
            stringify({
              type: "voted",
              details: {
                users: session.users,
                votes: session.votes,
                whiteCards: session.getUserWhitecards(user)
              }
            })
          )
        }
      }
    })
  }

  private startGame({ socket }: ServerEvent["startgame"]) {
    const session = socket.session
    if (!session) {
      throw new Error("no session")
    }
    const user = socket.user
    if (!user) {
      throw new Error("no user")
    }

    if (!user.host) {
      throw new Error("you are not a host")
    }

    if (session.status != "waiting" && session.status != "end") {
      throw new Error("game is started already")
    }
    if (session.users.length < 3) {
      throw new Error("need more players")
    }

    session.eventBus.clearListeners()
    session.eventBus.on("starting", () => {
      session.users.forEach((user) => {
        if (user.disconnected) {
          return
        }

        session.getUserSender(user).send(
          stringify({
            type: "gamestart",
            details: { status: session.status }
          })
        )
      })
    })
    session.eventBus.on("voting", () => {
      session.users.forEach((user) => {
        if (user.disconnected) {
          return
        }

        if (!session.redCard) {
          throw new Error("no red card")
        }

        session.getUserSender(user).send(
          stringify({
            type: "votingstarted",
            details: {
              whiteCards: session.getUserWhitecards(user),
              redCard: session.redCard,
              users: session.users,
              status: session.status,
              votes: session.votes,
              votingEndsAt: session.getTimeoutDate("voting")?.getTime() ?? null
            }
          })
        )
      })
    })
    session.eventBus.on("choosing", () => {
      session.users.forEach((user) => {
        if (user.disconnected) {
          return
        }

        session.getUserSender(user).send(
          stringify({
            type: "choosingstarted",
            details: {
              status: session.status,
              votes: session.votes,
              whiteCards: session.getUserWhitecards(user)
            }
          })
        )
      })
    })
    session.eventBus.on("choosingbest", () => {
      session.users.forEach((user) => {
        if (user.disconnected) {
          return
        }

        session.getUserSender(user).send(
          stringify({
            type: "choosingbeststarted",
            details: { status: session.status }
          })
        )
      })
    })
    session.eventBus.on("end", () => {
      session.users.forEach((user) => {
        if (user.disconnected) {
          return
        }

        session.getUserSender(user).send(
          stringify({
            type: "gameend",
            details: { status: session.status, users: session.users }
          })
        )
      })
    })

    session.startGame()
  }

  private choose({ userId, socket }: ServerEvent["choose"]) {
    const session = socket.session
    if (!session) {
      throw new Error("no session")
    }
    if (session.status != "choosing") {
      throw new Error("you can't choose")
    }

    const user = socket.user
    if (!user) {
      throw new Error("no user")
    }
    if (!user.master) {
      throw new Error("only master can choose card to show")
    }

    session.choose(userId, {
      onChoose() {
        session.users.forEach((user) => {
          if (user.disconnected) {
            return
          }

          session
            .getUserSender(user)
            .send(
              stringify({ type: "choose", details: { votes: session.votes } })
            )
        })
      }
    })
  }

  private chooseBest({ userId, socket }: ServerEvent["choosebest"]) {
    const session = socket.session
    if (!session) {
      throw new Error("no session")
    }
    if (session.status != "choosingbest") {
      throw new Error("you can't choose")
    }

    const user = socket.user
    if (!user) {
      throw new Error("no user")
    }
    if (!user.master) {
      throw new Error("only master can choose card to show")
    }

    session.chooseBest(userId)
  }

  private onSessionEnd(session: Session) {
    session.eventBus.clearListeners()
    this.sessions.delete(session.id)
  }
}

const game = new Game()

export default game
