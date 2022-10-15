import { nanoid } from "nanoid"

import stringify from "../functions/stringify"
import getRandomInt from "../functions/get-random-int"
import { whiteCards, redCards } from "./cards"
import gameController from "./controller"

import type { Session, Events } from "./types"

class Game {
  private sessions: Map<string, Session>

  constructor() {
    this.sessions = new Map()

    gameController.emitter.on("createsession", this.createSession)
    gameController.emitter.on("joinsession", this.joinSession)
    gameController.emitter.on("choose", this.choose)
    gameController.emitter.on("choosebest", this.chooseBest)
    gameController.emitter.on("startgame", this.startGame)
    gameController.emitter.on("vote", this.vote)
  }

  private createSession({ socket, username }: Events["createsession"]) {
    const sessionId = nanoid(5)
    const id = nanoid(5)
    const user = {
      id,
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
      _countdownTimer: null
    }

    this.sessions.set(sessionId, session)

    socket.session = session
    socket.user = user
    socket.send(
      stringify(
        {
          type: "response",
          details: { session }
        },
        true
      )
    )
  }

  private joinSession({ sessionId, socket, username }: Events["joinsession"]) {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error("session not found")
    }

    const id = nanoid(5)
    const user = {
      id,
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

    socket.session = session
    socket.user = user
    socket.send(
      stringify(
        {
          type: "response",
          details: {
            session
          }
        },
        true
      )
    )
  }

  private vote({ socket, text }: Events["vote"]) {
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

    user.voted = true
    session.votes.push({ card: text, userId: user.id, visible: false })

    session.users.forEach((user) =>
      user._socket.send(
        stringify({ type: "voted", details: { session } }, true)
      )
    )

    let allVoted = true
    for (const user of session.users) {
      if (!user.master && !user.voted) {
        allVoted = false
      }
    }
    if (allVoted) {
      session._countdownTimer && clearTimeout(session._countdownTimer)
      this.startChoosing(session)
    }
  }

  private startGame({ socket }: Events["startgame"]) {
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

    if (session.state != "waiting") {
      throw new Error("game is started already")
    }

    this.startVoting(session)
  }

  private startVoting(session: Session) {
    // prepare
    session.votes = []
    session.state = "voting"

    // decide who is master
    session.users[session._masterIndex].master = true
    if (session._masterIndex + 1 > session.users.length) {
      session._masterIndex = 0
    } else {
      session._masterIndex += 1
    }

    // get red card
    const redCardIndex = getRandomInt(0, session._availableRedCards.length - 1)
    session.redCard = session._availableRedCards[redCardIndex]
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
        whiteCards.push(session._availableWhiteCards[whiteCardIndex])
        session._availableWhiteCards.splice(whiteCardIndex, 1)
      }

      user._socket.send(
        stringify(
          {
            type: "voting-started",
            details: {
              session,
              whiteCards
            }
          },
          true
        )
      )
    }

    // start coundown
    session._countdownTimer = setTimeout(() => {
      session._countdownTimer = null
      this.startChoosing(session)
    }, 30000)
  }

  private startChoosing(session: Session) {
    session.state = "choosing"

    session.users.forEach((user) =>
      user._socket.send(
        stringify({ type: "choosing-started", details: { session } }, true)
      )
    )
  }

  private choose({ id, socket }: Events["choose"]) {
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

    const card = session.votes.find((card) => card.userId == id)
    if (!card) {
      throw new Error("provided user did not vote")
    }

    card.visible = true
    session.users.forEach((user) =>
      user._socket.send(stringify({ type: "choose", details: { session } }))
    )
  }

  private chooseBest({ id, socket }: Events["choosebest"]) {
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

    const votedUser = session.users.find((user) => user.id == id)
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
    session.users.forEach((user) =>
      user._socket.send(stringify({ type: "game-end" }, true))
    )
  }
}

const game = new Game()

export default game
