import { nanoid } from "nanoid"

import stringify from "../ws/stringify"
import getRandomInt from "../functions/get-random-int"
import { whiteCards, redCards } from "./cards"
import Controller from "./controller"

import type { Session, EmitteryEvent } from "./types"

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
  }

  private createSession({ socket, username }: EmitteryEvent["createsession"]) {
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
          type: "created",
          details: { session }
        },
        true
      )
    )
  }

  private joinSession({
    sessionId,
    socket,
    username
  }: EmitteryEvent["joinsession"]) {
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
    session.users.forEach((user) =>
      user._socket.send(
        stringify(
          {
            type: "joined",
            details: {
              session
            }
          },
          true
        )
      )
    )
  }

  private vote({ socket, text }: EmitteryEvent["vote"]) {
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

  private startGame({ socket }: EmitteryEvent["startgame"]) {
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
    const masterUser = session.users[session._masterIndex]
    if (!masterUser) {
      throw new Error("smth happened")
    }
    masterUser.master = true
    if (session._masterIndex + 1 > session.users.length) {
      session._masterIndex = 0
    } else {
      session._masterIndex += 1
    }

    // get red card
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
        if (!whiteCard) {
          throw new Error(whiteCard)
        }
        whiteCards.push(whiteCard)
        session._availableWhiteCards.splice(whiteCardIndex, 1)
      }

      user._socket.send(
        stringify(
          {
            type: "votingstarted",
            details: {
              session,
              whiteCards,
              timeLeft: 30000
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
        stringify({ type: "choosingstarted", details: { session } }, true)
      )
    )
  }

  private choose({ id, socket }: EmitteryEvent["choose"]) {
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

  private chooseBest({ id, socket }: EmitteryEvent["choosebest"]) {
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
      user._socket.send(stringify({ type: "gameend" }, true))
    )
  }
}

const game = new Game()

export default game
