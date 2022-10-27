import stringify from "../ws/stringify"
import Controller from "./controller"
import Session from "./session"

import type { ServerEvent } from "./types"
import type { User } from "@kado/schemas/dist/server/send"

class Game {
  private sessions: Map<string, Session>
  public controller: Controller

  constructor() {
    this.sessions = new Map()
    this.controller = new Controller()

    this.controller.emitter.on("createsession", this.createSession.bind(this))
    this.controller.emitter.on("joinsession", this.joinSession.bind(this))

    this.controller.emitter.on("choose", this.choose.bind(this))
    this.controller.emitter.on("choosebest", this.chooseBest.bind(this))
    this.controller.emitter.on("startgame", this.startGame.bind(this))
    this.controller.emitter.on("vote", this.vote.bind(this))
    this.controller.emitter.on("lostconnection", ({ socket }) => {
      const session = socket.session
      const user = socket.user
      if (!session || !user) {
        return
      }

      session.disconnectUser(user, () => this.onSessionEnd(session.id))
      socket.user = null
      socket.session = null
    })
  }

  private createSession({
    socket,
    username,
    avatarId
  }: ServerEvent["createsession"]) {
    const session = new Session()
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

    socket.on("close", () => {
      socket.session = null
      socket.user = null

      session.disconnectUser(user, () => this.onSessionEnd(session.id))
    })
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
      const userSocket = session.getUserSocket(user)

      if (user.id == newUser.id) {
        userSocket.send(
          stringify({
            type: "joined",
            details: {
              id: session.id,
              status: session.status,
              userId: newUser.id,
              users: session.users,
              whiteCards: session.getUserWhitecards(user)
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

    socket.on("close", () => {
      socket.session = null
      socket.user = null

      session.disconnectUser(newUser, () => this.onSessionEnd(session.id))
    })
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

    session.vote(user, text)
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
      throw new Error("you are not host")
    }

    if (session.status != "waiting" && session.status != "end") {
      throw new Error("game is started already")
    }
    if (session.users.length < 0) {
      throw new Error("need more players")
    }

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

    session.choose(userId)
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

  private onSessionEnd(sessionId: string) {
    this.sessions.delete(sessionId)
  }
}

const game = new Game()

export default game
