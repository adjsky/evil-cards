import { nanoid } from "nanoid"

import stringify from "../ws/stringify"
import getRandomInt from "../functions/get-random-int"
import { whiteCards, redCards } from "./cards"
import Controller from "./controller"

import type { User, Session, ServerEvent } from "./types"

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

      this.handleDisconnect(session, user)
      socket.user = null
      socket.session = null
    })
  }

  private createSession({
    socket,
    username,
    avatarId
  }: ServerEvent["createsession"]) {
    const sessionId = nanoid(5)
    const id = nanoid(5)
    const user = {
      id,
      avatarId,
      username,
      score: 0,
      host: true,
      master: false,
      voted: false,
      disconnected: false,
      _socket: socket,
      _whiteCards: []
    }
    const session: Session = {
      id: sessionId,
      state: "waiting",
      users: [user],
      redCard: null,
      votes: [],
      _availableWhiteCards: [...whiteCards],
      _availableRedCards: [...redCards],
      _masterIndex: 0,
      _countdownTimeout: null
    }

    this.sessions.set(sessionId, session)

    socket.session = session
    socket.user = user
    socket.send(
      stringify(
        {
          type: "created",
          details: { session, userId: user.id }
        },
        true
      )
    )

    user._socket.on("close", () => {
      socket.session = null
      socket.user = null

      this.handleDisconnect(session, user)
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
    const waitingState = session.state == "waiting" || session.state == "end"

    const previousUser = session.users.find((user) => user.username == username)
    let newUser: User
    if (previousUser && !waitingState) {
      previousUser._socket = socket
      previousUser.disconnected = false
      previousUser.avatarId = avatarId
      newUser = previousUser
    } else {
      if (!waitingState) {
        throw new Error("game is started already")
      }
      if (session.users.findIndex((user) => user.username == username) != -1) {
        throw new Error("nickname is taken")
      }

      const id = nanoid(5)
      const user = {
        id,
        avatarId,
        username,
        score: 0,
        host: false,
        master: false,
        voted: false,
        disconnected: false,
        _socket: socket,
        _whiteCards: []
      }
      session.users.push(user)
      newUser = user
    }

    socket.session = session
    socket.user = newUser
    session.users.forEach((user) => {
      if (previousUser && !waitingState) {
        previousUser._socket.send(
          stringify(
            {
              type: "joined",
              details: {
                session,
                userId: user.id,
                whiteCards: previousUser._whiteCards
              }
            },
            true
          )
        )
      }

      user._socket.send(
        stringify(
          {
            type: "joined",
            details: {
              session,
              userId: user.id
            }
          },
          true
        )
      )
    })

    newUser._socket.on("close", () => {
      socket.session = null
      socket.user = null

      this.handleDisconnect(session, newUser)
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
    if (session.state != "voting") {
      throw new Error("you can't vote now")
    }
    if (!user._whiteCards.includes(text)) {
      throw new Error("you have no such card")
    }
    if (user.voted) {
      throw new Error("you are voted already")
    }

    user.voted = true
    user._whiteCards = user._whiteCards.filter((cardText) => text != cardText)
    session.votes.push({ text, userId: user.id, visible: false })

    session.users.forEach((user) =>
      user._socket.send(
        stringify(
          { type: "voted", details: { session, whiteCards: user._whiteCards } },
          true
        )
      )
    )

    let allVoted = true
    for (const user of session.users) {
      if (!user.master && !user.voted && !user.disconnected) {
        allVoted = false
      }
    }
    if (allVoted) {
      session._countdownTimeout && clearTimeout(session._countdownTimeout)
      session._countdownTimeout = null
      this.startChoosing(session)
    }
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

    if (session.state != "waiting" && session.state != "end") {
      throw new Error("game is started already")
    }
    if (session.users.length < 2) {
      throw new Error("need more players")
    }

    session.state = "starting"
    session.users.forEach((user) =>
      user._socket.send(
        stringify({ type: "gamestart", details: { session } }, true)
      )
    )

    setTimeout(() => this.startVoting(session), 3000)
  }

  private startVoting(session: Session) {
    // prepare
    session.votes = []
    for (const user of session.users) {
      user.voted = false
    }
    session.state = "voting"

    // unmaster previous user
    const prevMasterUser = session.users.find((user) => user.master == true)
    if (prevMasterUser) {
      prevMasterUser.master = false
    }

    // decide who is master
    let masterUser = session.users[session._masterIndex]
    if (!masterUser) {
      throw new Error("smth happened")
    }
    if (masterUser.disconnected) {
      this.updateMasterIndex(session)
    }
    masterUser = session.users[session._masterIndex]
    if (!masterUser) {
      throw new Error("smth happened")
    }
    masterUser.master = true
    this.updateMasterIndex(session)

    // get red card
    if (session._availableRedCards.length == 0) {
      session._availableRedCards = redCards
    }
    const redCardIndex = getRandomInt(0, session._availableRedCards.length - 1)
    const redCard = session._availableRedCards[redCardIndex]
    if (!redCard) {
      throw new Error("smth happened")
    }
    session.redCard = redCard
    session._availableRedCards.splice(redCardIndex, 1)

    // get up to 10 white cards
    for (const user of session.users) {
      const whiteCards = user._whiteCards
      const whiteCardsLength = whiteCards.length

      for (let i = 0; i < 10 - whiteCardsLength; i++) {
        const whiteCardIndex = getRandomInt(
          0,
          session._availableWhiteCards.length - 1
        )
        const whiteCard = session._availableWhiteCards[whiteCardIndex]
        if (whiteCard) whiteCards.push(whiteCard)
        session._availableWhiteCards.splice(whiteCardIndex, 1)
      }

      user._socket.send(
        stringify(
          {
            type: "votingstarted",
            details: {
              session,
              whiteCards
            }
          },
          true
        )
      )
    }

    session._countdownTimeout = setTimeout(() => {
      session._countdownTimeout && clearTimeout(session._countdownTimeout)
      session._countdownTimeout = null
      this.startChoosing(session)
    }, 60000)
  }

  private startChoosing(session: Session) {
    session.users.forEach((user) => {
      if (user.voted || user.master || user.disconnected) {
        return
      }

      const randomCardIndex = getRandomInt(0, user._whiteCards.length - 1)
      const text = user._whiteCards[randomCardIndex]
      if (!text) {
        throw new Error("smth happened")
      }
      user.voted = true
      session.votes.push({ text, userId: user.id, visible: false })
      user._whiteCards.splice(randomCardIndex, 1)
    })

    session.state = "choosing"
    session.users.forEach((user) => {
      if (user.disconnected) {
        return
      }

      user._socket.send(
        stringify(
          {
            type: "choosingstarted",
            details: { session, whiteCards: user._whiteCards }
          },
          true
        )
      )
    })
  }

  private choose({ userId, socket }: ServerEvent["choose"]) {
    const session = socket.session
    if (!session) {
      throw new Error("no session")
    }
    if (session.state != "choosing") {
      throw new Error("you can't choose")
    }

    const user = socket.user
    if (!user) {
      throw new Error("no user")
    }
    if (!user.master) {
      throw new Error("only master can choose card to show")
    }

    const card = session.votes.find((card) => card.userId == userId)
    if (!card) {
      throw new Error("provided user did not vote")
    }

    card.visible = true
    session.users.forEach((user) => {
      if (user.disconnected) {
        return
      }

      user._socket.send(
        stringify({ type: "choose", details: { session } }, true)
      )
    })

    if (session.votes.every((vote) => vote.visible)) {
      session.state = "choosingbest"
      session.users.forEach((user) => {
        if (user.disconnected) {
          return
        }

        user._socket.send(
          stringify({ type: "choosingbeststarted", details: { session } }, true)
        )
      })
    }
  }

  private chooseBest({ userId, socket }: ServerEvent["choosebest"]) {
    const session = socket.session
    if (!session) {
      throw new Error("no session")
    }
    if (session.state != "choosingbest") {
      throw new Error("you can't choose")
    }

    const user = socket.user
    if (!user) {
      throw new Error("no user")
    }
    if (!user.master) {
      throw new Error("only master can choose card to show")
    }

    const votedUser = session.users.find((user) => user.id == userId)
    if (!votedUser) {
      throw new Error("provided user did not vote")
    }

    votedUser.score += 1
    if (votedUser.score >= 10) {
      this.endGame(session)
    } else {
      this.startVoting(session)
    }
  }

  private endGame(session: Session) {
    session.state = "end"
    session.redCard = null
    session.votes = []
    session._availableRedCards = redCards
    session._availableWhiteCards = whiteCards
    session._countdownTimeout && clearTimeout(session._countdownTimeout)
    session._countdownTimeout = null
    session._masterIndex = 0

    session.users = session.users.filter((user) => user.disconnected == false)
    for (const user of session.users) {
      user._whiteCards = []
      user.master = false
      user.voted = false
      user.score = 0
    }

    session.users.forEach((user) => {
      if (user.disconnected) {
        return
      }

      user._socket.send(
        stringify({ type: "gameend", details: { session } }, true)
      )
    })
  }

  private updateMasterIndex(session: Session) {
    let masterIndex = session._masterIndex

    do {
      if (masterIndex + 1 >= session.users.length) {
        masterIndex = 0
      } else {
        masterIndex += 1
      }
    } while (session.users[masterIndex]?.disconnected == true)

    session._masterIndex = masterIndex
  }

  public handleDisconnect(session: Session, user: User) {
    const isHost = user.host

    if (session.state == "waiting") {
      session.users = session.users.filter(
        (sessionUser) => sessionUser.id != user.id
      )
    } else {
      user.disconnected = true
    }

    const connectedUsers = session.users.filter(
      (user) => user.disconnected == false
    )
    if (connectedUsers.length == 0) {
      session._countdownTimeout && clearTimeout(session._countdownTimeout)
      session._countdownTimeout = null
      this.sessions.delete(session.id)
    } else {
      if (session.state == "waiting" || session.state == "end") {
        if (isHost) {
          connectedUsers[0]!.host = true
        }
      }

      if (session.state != "waiting" && user.master) {
        user.master = false

        // decide who is master
        let masterUser = session.users[session._masterIndex]
        if (!masterUser) {
          throw new Error("smth happened")
        }
        if (masterUser.disconnected) {
          this.updateMasterIndex(session)
        }
        masterUser = session.users[session._masterIndex]
        if (!masterUser) {
          throw new Error("smth happened")
        }
        masterUser.master = true
        this.updateMasterIndex(session)
      }

      if (session.state != "waiting" && connectedUsers.length == 1) {
        this.endGame(session)
      }
    }

    session.users.forEach((user) =>
      user._socket.send(
        stringify({ type: "disconnected", details: { session } }, true)
      )
    )
  }
}

const game = new Game()

export default game
