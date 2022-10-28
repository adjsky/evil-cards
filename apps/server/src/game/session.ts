import { nanoid } from "nanoid"
import Emittery from "emittery"

import { whiteCards, redCards } from "./cards"
import getRandomInt from "../functions/get-random-int"
import stringify from "../ws/stringify"

import type WebSocket from "ws"
import type { Status, User, Vote } from "@kado/schemas/dist/server/send"
import type { SessionEventBus, UserData } from "./types"

class Session {
  private userData: WeakMap<User, UserData> = new WeakMap()
  private availableRedCards = [...redCards]
  private availableWhiteCards = [...whiteCards]
  private masterIndex = 0
  private countdownTimeout: NodeJS.Timeout | null = null

  public votes: Vote[] = []
  public users: User[] = []
  public id: string
  public redCard: string | null = null
  public status: Status = "waiting"
  public eventBus: SessionEventBus

  constructor() {
    const id = nanoid(5)
    this.id = id
    this.eventBus = new Emittery()
  }

  public addUser(
    socket: WebSocket,
    username: string,
    avatarId: number,
    host: boolean
  ) {
    const id = nanoid(5)
    const user: User = {
      id,
      avatarId,
      username,
      score: 0,
      host,
      master: false,
      voted: false,
      disconnected: false
    }
    this.users.push(user)
    this.userData.set(user, {
      socket,
      whiteCards: []
    })

    return user
  }

  public reconnectUser(socket: WebSocket, user: User, avatarId: number) {
    const userData = this.userData.get(user)
    if (!userData) {
      throw new Error("no userdata found")
    }

    userData.socket = socket
    user.disconnected = false
    user.avatarId = avatarId
  }

  public disconnectUser(user: User, onSessionEnd: () => void) {
    const isHost = user.host

    if (this.status == "waiting") {
      this.users = this.users.filter((sessionUser) => sessionUser.id != user.id)
    } else {
      user.disconnected = true
    }

    const connectedUsers = this.users.filter(
      (user) => user.disconnected == false
    )
    if (connectedUsers.length == 0) {
      this.countdownTimeout && clearTimeout(this.countdownTimeout)
      this.countdownTimeout = null
      onSessionEnd()

      return
    }

    if (isHost && connectedUsers[0]) {
      connectedUsers[0].host = true
    }

    if (this.status != "waiting" && user.master) {
      user.master = false

      // decide who is master
      let masterUser = this.users[this.masterIndex]
      if (!masterUser) {
        throw new Error("smth happened")
      }
      if (masterUser.disconnected) {
        this.updateMasterIndex()
      }
      masterUser = this.users[this.masterIndex]
      if (!masterUser) {
        throw new Error("smth happened")
      }
      masterUser.master = true
      this.updateMasterIndex()
    }

    this.users.forEach((user) =>
      this.getUserSocket(user).send(
        stringify({ type: "userdisconnected", details: { users: this.users } })
      )
    )

    if (this.status != "waiting" && connectedUsers.length == 1) {
      this.endGame()
    }
  }

  public vote(user: User, text: string) {
    const userData = this.userData.get(user)
    if (!userData) {
      throw new Error("no userdata found")
    }

    user.voted = true
    userData.whiteCards = userData.whiteCards.filter(
      (cardText) => text != cardText
    )
    this.votes.push({ text, userId: user.id, visible: false })

    this.users.forEach((user) =>
      this.getUserSocket(user).send(
        stringify({
          type: "voted",
          details: {
            users: this.users,
            votes: this.votes,
            whiteCards: this.getUserWhitecards(user)
          }
        })
      )
    )

    let allVoted = true
    for (const user of this.users) {
      if (!user.master && !user.voted && !user.disconnected) {
        allVoted = false
      }
    }
    if (allVoted) {
      this.startChoosing()
    }
  }

  public startGame() {
    this.status = "starting"

    this.eventBus.emit("starting")
    setTimeout(() => this.startVoting(), 3000)
  }

  public startVoting() {
    // prepare
    this.votes = []
    for (const user of this.users) {
      user.voted = false
    }
    this.status = "voting"

    // unmaster previous user
    const prevMasterUser = this.users.find((user) => user.master == true)
    if (prevMasterUser) {
      prevMasterUser.master = false
    }

    // decide who is master
    let masterUser = this.users[this.masterIndex]
    if (!masterUser) {
      throw new Error("smth happened")
    }
    if (masterUser.disconnected) {
      this.updateMasterIndex()
    }
    masterUser = this.users[this.masterIndex]
    if (!masterUser) {
      throw new Error("smth happened")
    }
    masterUser.master = true
    this.updateMasterIndex()

    // get red card
    if (this.availableRedCards.length == 0) {
      this.availableRedCards = redCards
    }
    const redCardIndex = getRandomInt(0, this.availableRedCards.length - 1)
    const redCard = this.availableRedCards[redCardIndex]
    if (!redCard) {
      throw new Error("smth happened")
    }
    this.redCard = redCard
    this.availableRedCards.splice(redCardIndex, 1)

    // get up to 10 white cards
    for (const user of this.users) {
      const whiteCards = this.getUserWhitecards(user)
      const whiteCardsLength = whiteCards.length

      for (let i = 0; i < 10 - whiteCardsLength; i++) {
        const whiteCardIndex = getRandomInt(
          0,
          this.availableWhiteCards.length - 1
        )
        const whiteCard = this.availableWhiteCards[whiteCardIndex]
        if (whiteCard) whiteCards.push(whiteCard)
        this.availableWhiteCards.splice(whiteCardIndex, 1)
      }
    }

    this.eventBus.emit("voting")

    this.countdownTimeout = setTimeout(() => {
      this.countdownTimeout && clearTimeout(this.countdownTimeout)
      this.countdownTimeout = null
      this.startChoosing()
    }, 60000)
  }

  public startChoosing() {
    this.countdownTimeout && clearTimeout(this.countdownTimeout)
    this.countdownTimeout = null

    this.status = "choosing"

    this.users.forEach((user) => {
      if (!user.voted && !user.master && !user.disconnected) {
        const userWhitecards = this.getUserWhitecards(user)
        const randomCardIndex = getRandomInt(0, userWhitecards.length - 1)
        const text = userWhitecards[randomCardIndex]
        if (!text) {
          throw new Error("smth happened")
        }
        user.voted = true
        this.votes.push({ text, userId: user.id, visible: false })
        userWhitecards.splice(randomCardIndex, 1)
      }
    })

    this.eventBus.emit("choosing")
  }

  public choose(userId: string) {
    const card = this.votes.find((card) => card.userId == userId)
    if (!card) {
      throw new Error("provided user did not vote")
    }

    card.visible = true
    this.users.forEach((user) => {
      if (user.disconnected) {
        return
      }

      this.getUserSocket(user).send(
        stringify({ type: "choose", details: { votes: this.votes } })
      )
    })

    if (this.votes.every((vote) => vote.visible)) {
      this.status = "choosingbest"
      this.eventBus.emit("choosingbest")
    }
  }

  public chooseBest(userId: string) {
    const votedUser = this.users.find((user) => user.id == userId)
    if (!votedUser) {
      throw new Error("provided user did not vote")
    }

    votedUser.score += 1
    if (votedUser.score >= 10) {
      this.endGame()
    } else {
      this.startVoting()
    }
  }

  public endGame() {
    this.status = "end"
    this.redCard = null
    this.votes = []
    this.availableRedCards = redCards
    this.availableWhiteCards = whiteCards
    this.countdownTimeout && clearTimeout(this.countdownTimeout)
    this.countdownTimeout = null
    this.masterIndex = 0

    this.users = this.users.filter((user) => user.disconnected == false)
    for (const user of this.users) {
      this.getUserWhitecards(user).length = 0
      user.master = false
      user.voted = false
      user.score = 0
    }

    this.users.forEach((user) => {
      if (user.disconnected) {
        return
      }

      this.getUserSocket(user).send(
        stringify({ type: "gameend", details: { status: this.status } })
      )
    })
  }

  public getUserSocket(user: User) {
    const userData = this.userData.get(user)
    if (!userData) {
      throw new Error("no userdata found")
    }

    return userData.socket
  }

  public getUserWhitecards(user: User) {
    const userData = this.userData.get(user)
    if (!userData) {
      throw new Error("no userdata found")
    }

    return userData.whiteCards
  }

  private updateMasterIndex() {
    let masterIndex = this.masterIndex

    do {
      if (masterIndex + 1 >= this.users.length) {
        masterIndex = 0
      } else {
        masterIndex += 1
      }
    } while (this.users[masterIndex]?.disconnected == true)

    this.masterIndex = masterIndex
  }
}

export default Session
