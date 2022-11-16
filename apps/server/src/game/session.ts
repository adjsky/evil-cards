import { nanoid } from "nanoid"
import Emittery from "emittery"
import dayjs from "dayjs"

import { whiteCards, redCards } from "./cards"
import getRandomInt from "../functions/get-random-int"
import shuffleArray from "../functions/shuffle-array"
import { setDateTimeout } from "../lib/date-timeout"

import type { Status, User, Vote, Configuration } from "../lib/ws/send"
import type { DateTimeout } from "../lib/date-timeout"
import type { SessionEventBus } from "./types"

export type Sender<T> = {
  send: (data: T) => void
}
export type UserData<T> = {
  sender: Sender<T>
  whiteCards: string[]
}
type Timeouts = Record<"voting" | "starting", null | DateTimeout>

class Session<T = string> {
  private _userData: WeakMap<User, UserData<T>> = new WeakMap()
  private _availableRedCards = [...redCards]
  private _availableWhiteCards = [...whiteCards]
  private _masterIndex = 0
  private _timeouts: Timeouts = { voting: null, starting: null }

  private _votes: Vote[] = []
  private _users: User[] = []
  private _redCard: string | null = null
  private _status: Status = "waiting"
  private _eventBus: SessionEventBus = new Emittery()
  private _configuration: Configuration
  private _id: string

  constructor() {
    const id = nanoid(5)
    this._id = id

    this._configuration = {
      maxScore: 10,
      reader: "male",
      votingDuration: 60
    }
  }

  public get votes() {
    return this._votes
  }
  public get users() {
    return this._users
  }
  public get id() {
    return this._id
  }
  public get redCard() {
    return this._redCard
  }
  public get status() {
    return this._status
  }
  public get eventBus() {
    return this._eventBus
  }
  public get configuration() {
    return this._configuration
  }

  public addUser(
    sender: Sender<T>,
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
    this._users.push(user)
    this._userData.set(user, {
      sender,
      whiteCards: []
    })

    return user
  }

  public reconnectUser(sender: Sender<T>, user: User, avatarId: number) {
    const userData = this._userData.get(user)
    if (!userData) {
      throw new Error("no userdata found")
    }

    userData.sender = sender
    user.disconnected = false
    user.avatarId = avatarId
  }

  public disconnectUser(
    user: User,
    callbacks?: {
      onSessionEnd?: () => void
      onDisconnect?: (anyActivePlayers: boolean) => void
    }
  ) {
    const isHost = user.host

    if (this._status == "waiting") {
      this._users = this._users.filter(
        (sessionUser) => sessionUser.id != user.id
      )
    } else {
      user.disconnected = true
    }

    const connectedUsers = this._users.filter(
      (user) => user.disconnected == false
    )
    if (connectedUsers.length == 0) {
      this.clearTimeouts()
      if (callbacks?.onSessionEnd) {
        callbacks?.onSessionEnd()
      }
      if (callbacks?.onDisconnect) {
        callbacks.onDisconnect(false)
      }

      return
    }

    if (isHost && connectedUsers[0]) {
      connectedUsers[0].host = true
    }

    if (this._status != "waiting" && user.master) {
      user.master = false

      // decide who is master
      let masterUser = this._users[this._masterIndex]
      if (masterUser.disconnected) {
        this.updateMasterIndex()
      }
      masterUser = this._users[this._masterIndex]
      masterUser.master = true
      this.updateMasterIndex()
    }

    if (callbacks?.onDisconnect) {
      callbacks.onDisconnect(true)
    }

    if (this._status != "waiting" && connectedUsers.length < 3) {
      this.endGame()
    }
  }

  public async startGame() {
    this._status = "starting"
    this.users.forEach((user) => {
      user.score = 0
    })
    this._timeouts.starting = setDateTimeout(
      () => this.startVoting(),
      dayjs().add(3, "s").toDate()
    )

    await this._eventBus.emit("starting")
  }

  public vote(user: User, text: string, callbacks?: { onVote?: () => void }) {
    const userData = this._userData.get(user)
    if (!userData) {
      throw new Error("no userdata found")
    }

    user.voted = true
    userData.whiteCards = userData.whiteCards.filter(
      (cardText) => text != cardText
    )
    this._votes.push({ text, userId: user.id, visible: false })

    if (callbacks?.onVote) {
      callbacks.onVote()
    }

    let allVoted = true
    for (const user of this._users) {
      if (!user.master && !user.voted && !user.disconnected) {
        allVoted = false
      }
    }
    if (allVoted) {
      this.startChoosing()
    }
  }

  public async choose(userId: string, callbacks?: { onChoose?: () => void }) {
    const card = this._votes.find((card) => card.userId == userId)
    if (!card) {
      throw new Error("provided user did not vote")
    }
    card.visible = true

    if (callbacks?.onChoose) {
      callbacks.onChoose()
    }

    if (this._votes.every((vote) => vote.visible)) {
      this._status = "choosingbest"
      await this._eventBus.emit("choosingbest")
    }
  }

  public chooseBest(userId: string) {
    const votedUser = this._users.find((user) => user.id == userId)
    if (!votedUser) {
      throw new Error("provided user did not vote")
    }

    votedUser.score += 1
    if (votedUser.score >= this._configuration.maxScore) {
      this.endGame()
    } else {
      this.startVoting()
    }
  }

  public async endGame() {
    this._status = "end"
    this._redCard = null
    this._votes = []
    this._availableRedCards = [...redCards]
    this._availableWhiteCards = [...whiteCards]
    this._masterIndex = 0

    this.clearTimeouts()

    this._users = this._users.filter((user) => user.disconnected == false)
    for (const user of this._users) {
      this.getUserWhitecards(user).length = 0
      user.master = false
      user.voted = false
    }

    await this._eventBus.emit("end")
  }

  public getUserSender(user: User) {
    const userData = this._userData.get(user)
    if (!userData) {
      throw new Error("no userdata found")
    }

    return userData.sender
  }

  public getTimeoutDate(name: keyof Timeouts) {
    return this._timeouts[name]?.date
  }

  public getUserWhitecards(user: User) {
    const userData = this._userData.get(user)
    if (!userData) {
      throw new Error("no userdata found")
    }

    return userData.whiteCards
  }

  public updateConfiguration(configuration: Configuration) {
    this._configuration = configuration
  }

  private updateMasterIndex() {
    let masterIndex = this._masterIndex

    do {
      if (masterIndex + 1 >= this._users.length) {
        masterIndex = 0
      } else {
        masterIndex += 1
      }
    } while (this._users.at(masterIndex)?.disconnected == true)

    this._masterIndex = masterIndex
  }

  private clearTimeouts() {
    for (const [key, value] of Object.entries(this._timeouts)) {
      if (value == null) {
        continue
      }

      value.clear()
      this._timeouts[key as keyof Timeouts] = null
    }
  }

  private async startVoting() {
    // prepare
    this._votes = []
    for (const user of this._users) {
      user.voted = false
    }
    this._status = "voting"

    // unmaster previous user
    const prevMasterUser = this._users.find((user) => user.master == true)
    if (prevMasterUser) {
      prevMasterUser.master = false
    }

    // decide who is master
    let masterUser = this._users[this._masterIndex]
    if (masterUser.disconnected) {
      this.updateMasterIndex()
    }
    masterUser = this._users[this._masterIndex]
    masterUser.master = true
    this.updateMasterIndex()

    // get red card
    const redCardIndex = getRandomInt(0, this._availableRedCards.length - 1)
    const redCard = this._availableRedCards[redCardIndex]
    this._redCard = redCard
    this._availableRedCards.splice(redCardIndex, 1)

    // get up to 10 white cards
    for (const user of this._users) {
      const whiteCards = this.getUserWhitecards(user)
      const whiteCardsLength = whiteCards.length

      for (let i = 0; i < 10 - whiteCardsLength; i++) {
        const whiteCardIndex = getRandomInt(
          0,
          this._availableWhiteCards.length - 1
        )
        const whiteCard = this._availableWhiteCards.at(whiteCardIndex)
        if (whiteCard) whiteCards.push(whiteCard)
        this._availableWhiteCards.splice(whiteCardIndex, 1)
      }
    }

    this._timeouts.voting = setDateTimeout(() => {
      if (this._timeouts.voting) {
        this._timeouts.voting.clear()
        this._timeouts.voting = null
      }
      this.startChoosing()
    }, dayjs().add(this._configuration.votingDuration, "s").toDate())

    await this._eventBus.emit("voting")
  }

  private async startChoosing() {
    if (this._timeouts.voting) {
      this._timeouts.voting.clear()
      this._timeouts.voting = null
    }

    this._status = "choosing"

    this._users.forEach((user) => {
      if (!user.voted && !user.master && !user.disconnected) {
        const userWhitecards = this.getUserWhitecards(user)
        const randomCardIndex = getRandomInt(0, userWhitecards.length - 1)
        const text = userWhitecards[randomCardIndex]
        user.voted = true
        this._votes.push({ text, userId: user.id, visible: false })
        userWhitecards.splice(randomCardIndex, 1)
      }
    })
    this._votes = shuffleArray(this._votes)

    await this._eventBus.emit("choosing")
  }
}

export default Session
