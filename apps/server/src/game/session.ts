import { nanoid } from "nanoid"
import Emittery from "emittery"
import dayjs from "dayjs"

import { whiteCards, redCards } from "./cards"
import getRandomInt from "../functions/get-random-int"
import shuffleArray from "../functions/shuffle-array"
import { setDateTimeout } from "../lib/date-timeout"
import {
  BEST_CARD_VIEW_DURATION_MS,
  GAME_START_DELAY_MS,
  MIN_PLAYERS_TO_START_GAME,
  SESSION_ID_SIZE,
  USER_ID_SIZE
} from "./constants"

import type {
  Status,
  Player,
  Vote,
  Configuration,
  SessionEvents,
  PlayerSender
} from "./types"
import type { DateTimeout } from "../lib/date-timeout"

type Timeouts = Record<"voting" | "starting" | "choosebest", null | DateTimeout>

class Session {
  private _id: string
  private _availableRedCards: string[]
  private _availableWhiteCards: string[]
  private _timeouts: Timeouts
  private _votes: Vote[]
  private _players: Player[]
  private _redCard: string | null
  private _status: Status
  private _configuration: Configuration
  private _events: SessionEvents

  public get votes() {
    return this._votes
  }
  public get players() {
    return this._players
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
  public get events() {
    return {
      on: this._events.on.bind(this._events),
      off: this._events.off.bind(this._events),
      clear: this._events.clearListeners.bind(this._events)
    }
  }
  public get configuration() {
    return this._configuration
  }

  public constructor() {
    this._id = nanoid(SESSION_ID_SIZE)
    this._configuration = {
      maxScore: 10,
      reader: "on",
      votingDurationSeconds: 60
    }
    this._availableRedCards = [...redCards]
    this._availableWhiteCards = [...whiteCards]
    this._timeouts = {
      choosebest: null,
      starting: null,
      voting: null
    }
    this._votes = []
    this._players = []
    this._redCard = null
    this._status = "waiting"
    this._events = new Emittery()
  }

  public join(
    sender: PlayerSender,
    nickname: string,
    avatarId: number,
    host: boolean
  ) {
    const existingPlayer = this._players.find(
      (player) => player.nickname == nickname
    )

    if (existingPlayer) {
      if (!existingPlayer.disconnected) {
        throw new Error("nickname is taken")
      }

      existingPlayer.disconnected = false
      existingPlayer.avatarId = avatarId

      this._events.emit("join", existingPlayer)
    } else {
      const isWaiting = this.isWaiting()

      if (!isWaiting) {
        throw new Error("game is started")
      }

      const player: Player = {
        id: nanoid(USER_ID_SIZE),
        avatarId,
        nickname,
        score: 0,
        host,
        master: false,
        voted: false,
        disconnected: false,
        deck: [],
        sender
      }

      this._players.push(player)
      this._events.emit("join", player)
    }
  }

  public leave(playerId: string) {
    const player = this._players.find((player) => player.id == playerId)
    if (!player) {
      throw new Error("no player")
    }

    const isPlaying = this.isPlaying()

    if (isPlaying) {
      player.disconnected = true
    } else {
      this._players = this._players.filter((p) => p.id != playerId)
    }

    const remainingPlayers = this._players.filter((p) => !p.disconnected)

    if (remainingPlayers.length == 0) {
      this.clearTimeouts()

      this._events.emit("leave", player)
      this._events.emit("sessionend")

      return
    }

    if (player.host) {
      if (isPlaying) {
        player.host = false
      }

      remainingPlayers[0].host = true
    }

    if (isPlaying && player.master) {
      this.passMaster()
    }

    this._events.emit("leave", player)

    if (isPlaying && remainingPlayers.length < MIN_PLAYERS_TO_START_GAME) {
      this.endGame()
    }
  }

  public updateConfiguration(playerId: string, configuration: Configuration) {
    const player = this._players.find((p) => p.id == playerId)

    if (!player?.host) {
      throw new Error("not allowed")
    }

    this._configuration = configuration

    this._events.emit("configurationchange", configuration)
  }

  public startGame(playerId: string) {
    const player = this._players.find((p) => p.id == playerId)

    if (
      !player ||
      !player.host ||
      this.isPlaying() ||
      this._players.length < MIN_PLAYERS_TO_START_GAME
    ) {
      throw new Error("not allowed")
    }

    this._status = "starting"

    this.players.forEach((p) => {
      p.score = 0
    })

    this._timeouts.starting = setDateTimeout(() => {
      this._timeouts.starting = null
      this.startVoting()
    }, dayjs().add(GAME_START_DELAY_MS, "ms").toDate())

    this._events.emit("statuschange", this._status)
  }

  public vote(playerId: string, text: string) {
    const player = this._players.find((p) => p.id == playerId)
    const cardIndex = player?.deck.findIndex((deckCard) => deckCard == text)

    if (!player || cardIndex == undefined) {
      throw new Error("invalid player id")
    }

    if (cardIndex == -1) {
      throw new Error("invalid card text")
    }

    if (this._status != "voting" || player.master || player.voted) {
      throw new Error("you can't vote")
    }

    player.voted = true

    player.deck.splice(cardIndex, 1)

    const vote: Vote = {
      text,
      playerId: player.id,
      visible: false,
      winner: false
    }
    this._votes.push(vote)

    this._events.emit("vote", vote)

    const nPlayersToVote = this._players.filter(
      (player) => !player.master && !player.disconnected
    ).length

    if (nPlayersToVote == this._votes.length) {
      this.startChoosing()
    }
  }

  public choose(playerId: string, choosedPlayerId: string) {
    const player = this._players.find((p) => p.id == playerId)
    const choosedVote = this._votes.find(
      (vote) => vote.playerId == choosedPlayerId
    )

    if (!player) {
      throw new Error("invalid player id")
    }

    if (!choosedVote) {
      throw new Error("invalid choosed player id")
    }

    if (this._status != "choosing" || !player.master) {
      throw new Error("you can't choose")
    }

    choosedVote.visible = true

    this._events.emit("choose", choosedVote)

    if (this._votes.every((vote) => vote.visible)) {
      this.startChoosingWinner()
    }
  }

  public chooseWinner(playerId: string, choosedPlayerId: string) {
    const player = this._players.find((p) => p.id == playerId)

    const choosedVote = this._votes.find(
      (vote) => vote.playerId == choosedPlayerId
    )
    const choosedPlayer = this._players.find((p) => p.id == choosedPlayerId)

    if (!player) {
      throw new Error("invalid player id")
    }

    if (!choosedPlayer || !choosedVote) {
      throw new Error("invalid choosed player id")
    }

    if (!player.master || this._status != "choosingwinner") {
      throw new Error("you can't choose winner")
    }

    choosedPlayer.score += 1
    choosedVote.winner = true

    this._events.emit("choosewinner", choosedVote)

    const didPlayerWin = choosedPlayer.score >= this._configuration.maxScore
    this.startWinnerCardView(didPlayerWin)
  }

  public endGame() {
    this._status = "end"
    this._redCard = null
    this._votes = []
    this._availableRedCards = [...redCards]
    this._availableWhiteCards = [...whiteCards]

    this.clearTimeouts()

    this._players = this.players.filter((p) => !p.disconnected)

    for (const player of this._players) {
      player.deck.length = 0
      player.master = false
      player.voted = false
    }

    this._events.emit("statuschange", this._status)
  }

  public getTimeoutDate(name: keyof Timeouts) {
    return this._timeouts[name]?.date
  }

  private startVoting() {
    this._votes = []
    this._players.forEach((player) => {
      player.voted = false
    })
    this._status = "voting"

    this.passMaster()

    const redCardIndex = getRandomInt(0, this._availableRedCards.length - 1)
    this._redCard = this._availableRedCards[redCardIndex]
    this._availableRedCards.splice(redCardIndex, 1)

    this._players.forEach((player) => {
      const deckLength = player.deck.length

      for (let i = 0; i < 10 - deckLength; i++) {
        const randomIndex = getRandomInt(
          0,
          this._availableWhiteCards.length - 1
        )

        const whiteCard = this._availableWhiteCards[randomIndex]
        player.deck.push(whiteCard)

        this._availableWhiteCards.splice(randomIndex, 1)
      }
    })

    this._timeouts.voting = setDateTimeout(() => {
      this._timeouts.voting = null
      this.startChoosing()
    }, dayjs().add(this._configuration.votingDurationSeconds, "s").toDate())

    this._events.emit("statuschange", this._status)
  }

  private startChoosing() {
    if (this._timeouts.voting) {
      this._timeouts.voting.clear()
      this._timeouts.voting = null
    }

    this._status = "choosing"

    this._players.forEach((player) => {
      if (player.voted || player.master || player.disconnected) {
        return
      }

      const randomIndex = getRandomInt(0, player.deck.length - 1)
      const text = player.deck[randomIndex]

      player.voted = true

      this._votes.push({
        text,
        playerId: player.id,
        visible: false,
        winner: false
      })

      player.deck.splice(randomIndex, 1)
    })

    this._votes = shuffleArray(this._votes)

    this._events.emit("statuschange", this._status)
  }

  private startChoosingWinner() {
    this._status = "choosingwinner"
    this._events.emit("statuschange", this._status)
  }

  private startWinnerCardView(didPlayerWin?: boolean) {
    this._status = "winnercardview"
    this._events.emit("statuschange", this._status)

    this._timeouts.choosebest = setDateTimeout(() => {
      this._timeouts.choosebest = null

      if (didPlayerWin) {
        this.endGame()
      } else {
        this.startVoting()
      }
    }, dayjs().add(BEST_CARD_VIEW_DURATION_MS, "ms").toDate())
  }

  private passMaster() {
    const currentMasterIndex = this._players.findIndex(
      (player) => player.master
    )

    if (currentMasterIndex == -1) {
      this.players[0].master = true

      return
    }

    this._players[currentMasterIndex].master = false

    let nextMasterPlayerIndex = currentMasterIndex
    do {
      if (nextMasterPlayerIndex + 1 >= this._players.length) {
        nextMasterPlayerIndex = 0
      } else {
        nextMasterPlayerIndex += 1
      }
    } while (this._players[nextMasterPlayerIndex].disconnected)

    this._players[nextMasterPlayerIndex].master = true
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

  private isWaiting() {
    return (
      this._status == "waiting" ||
      this._status == "end" ||
      this._status == "starting"
    )
  }

  private isPlaying() {
    return !this.isWaiting()
  }
}

export default Session
