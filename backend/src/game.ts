import { nanoid } from "nanoid"
import { match, P } from "ts-pattern"
import { serializeError } from "serialize-error"

import { ChooseDetails, messageSchema, VoteDetails } from "./schemas"
import stringify from "./functions/stringify"
import getRandomInt from "./functions/get-random-int"

import type { WebSocket } from "ws"
import type { CreateSessionDetails, JoinSessionDetails } from "./schemas"

const whiteCards: string[] = Array.from({ length: 500 }).map(
  (_, index) => `белая карта ${index + 1}`
)
const redCards: string[] = Array.from({ length: 500 }).map(
  (_, index) => `красная карта ${index + 1}`
)

type User = {
  id: string
  username: string
  score: number
  host: boolean
  master: boolean
  voted: boolean
  disconnected: boolean
  _whiteCards: string[]
  _socket: WebSocket
}
type Session = {
  id: string
  state: "waiting" | "voting" | "choosing" | "end"
  users: User[]
  redCard: string | null
  votes: { card: string; userId: string; visible: boolean }[]
  _availableWhiteCards: string[]
  _availableRedCards: string[]
  _masterIndex: number
  _countdownTimer: NodeJS.Timeout | null
}

type MessageDetails = {
  socket: WebSocket
  id: string
  sessionId: string
}

class Game {
  private sessions: Map<string, Session>

  constructor() {
    this.sessions = new Map()
  }

  handleConnection(socket: WebSocket) {
    let sessionId: string | null = null
    let id: string | null = null

    socket.on("message", (rawData) => {
      try {
        const message = messageSchema.parse(JSON.parse(rawData.toString()))

        match(message)
          .with({ type: "create-session" }, ({ details }) => {
            if (sessionId) {
              throw new Error("you are in game")
            }

            const result = this.createSession(details, socket)
            sessionId = result.sessionId
            id = result.id
          })
          .with({ type: "join-session" }, ({ details }) => {
            if (sessionId) {
              throw new Error("you are in game")
            }

            const result = this.joinSession(details, socket)
            sessionId = result.sessionId
            id = result.id
          })
          .with({ type: "start-game" }, () => {
            if (!sessionId || !id) {
              throw new Error("you are not connected to any session")
            }
            this.startGame({ socket, id, sessionId })
          })
          .with({ type: "vote" }, ({ details }) => {
            if (!sessionId || !id) {
              throw new Error("you are not connected to any session")
            }
            this.vote(details, { id, socket, sessionId })
          })
          .with({ type: "choose" }, ({ details }) => {
            if (!sessionId || !id) {
              throw new Error("you are not connected to any session")
            }
            this.choose(details, { id, socket, sessionId })
          })
          .with({ type: "choose-best" }, ({ details }) => {
            if (!sessionId || !id) {
              throw new Error("you are not connected to any session")
            }
            this.chooseBest(details, { id, socket, sessionId })
          })
          .exhaustive()
      } catch (error) {
        console.error(error)
        socket.send(
          stringify({
            type: "error",
            data: serializeError(error).message
          })
        )
      }
    })
  }

  private createSession(details: CreateSessionDetails, socket: WebSocket) {
    const sessionId = nanoid(5)
    const id = nanoid(5)
    const session: Session = {
      id: sessionId,
      state: "waiting",
      users: [
        {
          id,
          username: details.username,
          score: 0,
          host: true,
          master: false,
          voted: false,
          disconnected: false,
          _socket: socket,
          _whiteCards: []
        }
      ],
      redCard: null,
      votes: [],
      _availableWhiteCards: [...whiteCards],
      _availableRedCards: [...redCards],
      _masterIndex: 0,
      _countdownTimer: null
    }

    this.sessions.set(sessionId, session)

    socket.send(
      stringify(
        {
          type: "response",
          details: { session }
        },
        true
      )
    )

    return { sessionId, id }
  }

  private joinSession(details: JoinSessionDetails, socket: WebSocket) {
    const session = this.sessions.get(details.sessionId)
    if (!session) {
      throw new Error("session not found")
    }

    const id = nanoid(5)
    session.users.push({
      id,
      username: details.username,
      score: 0,
      host: false,
      master: false,
      voted: false,
      disconnected: false,
      _socket: socket,
      _whiteCards: []
    })

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

    return { id, sessionId: details.sessionId }
  }

  private vote(
    details: VoteDetails,
    { id, socket, sessionId }: MessageDetails
  ) {
    const session = this.sessions.get(sessionId)!
    const user = session.users.find((user) => user.id == id)!

    if (user.master) {
      throw new Error("master can't vote")
    }

    if (session.state != "voting") {
      throw new Error("you can't vote now")
    }

    if (!user._whiteCards.includes(details.text)) {
      throw new Error("you have no such card")
    }

    user.voted = true
    session.votes.push({ card: details.text, userId: id, visible: false })

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
      clearTimeout(session._countdownTimer!)
      this.startChoosing(session)
    }
  }

  private startGame({ id, sessionId }: MessageDetails) {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error("session not found")
    }

    const host = session.users.find((user) => user.host == true)
    if (host?.id != id) {
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

  private choose(details: ChooseDetails, messageDetails: MessageDetails) {
    const session = this.sessions.get(messageDetails.sessionId)!

    if (session.state != "choosing") {
      throw new Error("you can't choose")
    }

    const user = session.users.find((user) => user.id == messageDetails.id)!

    if (!user.master) {
      throw new Error("only master can choose card to show")
    }

    const card = session.votes.find((card) => card.userId == details.id)
    if (!card) {
      throw new Error("provided user did not vote")
    }

    card.visible = true
    session.users.forEach((user) =>
      user._socket.send(stringify({ type: "choose", details: { session } }))
    )
  }

  private chooseBest(details: ChooseDetails, messageDetails: MessageDetails) {
    const session = this.sessions.get(messageDetails.sessionId)!

    if (session.state != "choosing") {
      throw new Error("you can't choose")
    }

    const user = session.users.find((user) => user.id == messageDetails.id)!

    if (!user.master) {
      throw new Error("only master can choose card to show")
    }

    const votedUser = session.users.find((user) => user.id == details.id)
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

export default Game
