import dayjs from "dayjs"
import Emittery from "emittery"

import {
  preCollectDecks,
  type PreCollectedDecks,
  type UploadedDeck
} from "@evil-cards/core/deck-parser"

import getRandomInt from "../functions/get-random-int.ts"
import shuffleArray from "../functions/shuffle-array.ts"
import { setDateTimeout } from "../lib/date-timeout.ts"
import { nanoid } from "../lib/nanoid-alphanumeric.ts"
import {
  BEST_CARD_VIEW_DURATION_MS,
  GAME_START_DELAY_MS,
  LEAVE_TIMEOUT_MS,
  MAX_PLAYERS_IN_SESSSION,
  MIN_PLAYERS_TO_START_GAME,
  SESSION_END_TIMEOUT_MS,
  SESSION_ID_SIZE,
  USER_ID_SIZE
} from "./constants.ts"
import { GameError } from "./errors.ts"

import type { ISession, ISessionFactory } from "./interfaces.ts"
import type {
  Configuration,
  SessionEvents,
  SessionPlayer,
  Status,
  Timeouts,
  Vote
} from "./types.ts"

class Session implements ISession {
  private _id: string
  private _timeouts: Timeouts
  private _votes: Vote[]
  private _players: SessionPlayer[]
  private _redCard: string | null
  private _status: Status
  private _configuration: Configuration
  private _events: SessionEvents

  private _redDeck: Map<string, string> | null
  private _whiteDeck: Map<string, string> | null

  private _discardedRedCards: Map<string, string>
  private _discardedWhiteCards: Map<string, string>

  private _decks: PreCollectedDecks & { custom: UploadedDeck | null }

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
      clearListeners: this._events.clearListeners.bind(this._events)
    }
  }
  public get configuration() {
    return this._configuration
  }

  public constructor(precollectedDecks: PreCollectedDecks) {
    this._id = nanoid(SESSION_ID_SIZE)
    this._configuration = {
      maxScore: 10,
      reader: true,
      votingDurationSeconds: 60,
      deck: "normal",
      public: true
    }
    this._redDeck = null
    this._whiteDeck = null
    this._discardedRedCards = new Map()
    this._discardedWhiteCards = new Map()
    this._timeouts = {
      choosebest: null,
      starting: null,
      voting: null,
      endsesion: null
    }
    this._votes = []
    this._players = []
    this._redCard = null
    this._status = "waiting"
    this._events = new Emittery()
    this._decks = {
      ...precollectedDecks,
      custom: null
    }
  }

  public join(nickname: string, avatarId: number) {
    const existingPlayer = this._players.find(
      (player) => player.nickname == nickname
    )

    if (existingPlayer) {
      if (!existingPlayer.disconnected && !existingPlayer.leaveTimeout) {
        throw new GameError("ForbiddenNickname")
      }

      if (existingPlayer.leaveTimeout) {
        clearTimeout(existingPlayer.leaveTimeout)
        existingPlayer.leaveTimeout = null
      }

      existingPlayer.disconnected = false
      existingPlayer.avatarId = avatarId

      this._events.emit("join", existingPlayer)

      return existingPlayer
    }

    if (this._players.length >= MAX_PLAYERS_IN_SESSSION) {
      throw new GameError("TooManyPlayers")
    }

    const isWaiting = this.isWaiting()
    if (!isWaiting) {
      throw new GameError("GameAlreadyStarted")
    }

    if (this._timeouts.endsesion != null) {
      this._timeouts.endsesion.clear()
      this._timeouts.endsesion = null
    }

    const player: SessionPlayer = {
      id: nanoid(USER_ID_SIZE),
      avatarId,
      nickname,
      score: 0,
      host: this._players.length == 0,
      master: false,
      voted: false,
      disconnected: false,
      hand: new Map(),
      leaveTimeout: null
    }

    this._players.push(player)
    this._events.emit("join", player)

    return player
  }

  public leave(playerId: string, isKick: boolean) {
    const player = this._players.find((player) => player.id == playerId)
    if (!player) {
      throw new GameError("NoPlayer")
    }

    if (player.disconnected) {
      throw new GameError("Disconnected")
    }

    const doWork = () => {
      const isPlaying = this.isPlaying()

      if (isPlaying) {
        player.disconnected = true
      } else {
        this._players = this._players.filter((p) => p.id != playerId)
      }

      const remainingPlayers = this._players.filter((p) => !p.disconnected)
      if (remainingPlayers.length == 0) {
        this._events.emit("leave", player)

        this._timeouts.endsesion = setDateTimeout(() => {
          this._timeouts.endsesion = null

          this.clearTimeouts()
          this._events.emit("sessionend")
        }, dayjs().add(SESSION_END_TIMEOUT_MS, "ms").toDate())

        return
      }

      if (player.host) {
        if (isPlaying) {
          player.host = false
        }

        remainingPlayers[0].host = true
      }

      if (isPlaying && player.master) {
        if (this._timeouts.choosebest) {
          this._timeouts.choosebest.clear()
          this._timeouts.choosebest = null
        }

        if (this._timeouts.voting) {
          this._timeouts.voting.clear()
          this._timeouts.voting = null
        }

        this.startVoting(true)
      }

      this._events.emit("leave", player)

      if (isPlaying && remainingPlayers.length < MIN_PLAYERS_TO_START_GAME) {
        this.endGame()
      }
    }

    if (this.isPlaying() && !isKick) {
      player.leaveTimeout = setTimeout(() => {
        player.leaveTimeout = null
        doWork()
      }, LEAVE_TIMEOUT_MS)
    } else {
      doWork()
    }
  }

  public updateConfiguration(playerId: string, configuration: Configuration) {
    const player = this._players.find((p) => p.id == playerId)

    if (!player) {
      throw new GameError("NoPlayer")
    }

    if (!player.host) {
      throw new GameError("Host")
    }

    this._configuration = configuration

    this._events.emit("configurationchange", configuration)
  }

  public addCustomDeck(playerId: string, deck: UploadedDeck) {
    const player = this._players.find((p) => p.id == playerId)

    if (!player) {
      throw new GameError("NoPlayer")
    }

    if (!player.host) {
      throw new GameError("Host")
    }

    this._decks.custom = deck
  }

  public startGame(playerId: string) {
    const player = this._players.find((p) => p.id == playerId)

    if (!player) {
      throw new GameError("NoPlayer")
    }

    if (!player.host) {
      throw new GameError("Host")
    }

    if (this.isPlaying()) {
      throw new GameError("GameAlreadyStarted")
    }

    if (this._players.length < MIN_PLAYERS_TO_START_GAME) {
      throw new GameError("NotEnoughPlayers")
    }

    this._status = "starting"

    this._redDeck = this.buildDeck("red")
    this._whiteDeck = this.buildDeck("white")

    this.players.forEach((p) => {
      p.score = 0
    })

    this._timeouts.starting = setDateTimeout(() => {
      this._timeouts.starting = null
      this.startVoting()
    }, dayjs().add(GAME_START_DELAY_MS, "ms").toDate())

    this._events.emit("statuschange", this._status)
  }

  public vote(playerId: string, cardId: string) {
    const player = this._players.find((p) => p.id == playerId)

    if (!player) {
      throw new GameError("InvalidPlayerId")
    }

    const card = player.hand.get(cardId)

    if (!card) {
      throw new GameError("InvalidCard")
    }

    if (this._status != "voting" || player.master || player.voted) {
      throw new GameError("ForbbidenToVote")
    }

    player.voted = true
    player.hand.delete(cardId)

    const vote: Vote = {
      card: {
        id: cardId,
        text: card
      },
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
      throw new GameError("InvalidPlayerId")
    }

    if (!choosedVote) {
      throw new GameError("InvalidChoosedPlayerId")
    }

    if (this._status != "choosing" || !player.master) {
      throw new GameError("ForbiddenToChoose")
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
      throw new GameError("InvalidPlayerId")
    }

    if (!choosedPlayer || !choosedVote) {
      throw new GameError("InvalidChoosedPlayerId")
    }

    if (!player.master || this._status != "choosingwinner") {
      throw new GameError("ForbiddenToChooseWinner")
    }

    choosedPlayer.score += 1
    choosedVote.winner = true

    this._events.emit("choosewinner", choosedVote)

    const didPlayerWin = choosedPlayer.score >= this._configuration.maxScore
    this.startWinnerCardView(didPlayerWin)
  }

  public discardCards(playerId: string) {
    if (this.isWaiting()) {
      throw new GameError("NotPlaying")
    }

    const player = this._players.find((p) => p.id == playerId)

    if (!player) {
      throw new GameError("InvalidPlayerId")
    }

    if (player.score == 0) {
      throw new GameError("ScoreIsTooLowToDiscardCards")
    }

    player.hand.forEach(([id, text]) => {
      this._discardedWhiteCards.set(id, text)
    })
    player.hand.clear()
    player.score -= 1

    this.fillPlayerDeck(player)

    this._events.emit("cardsdiscard", player)
  }

  public endGame() {
    this._status = "end"
    this._redCard = null
    this._votes = []
    this._redDeck = null
    this._whiteDeck = null
    this._discardedRedCards.clear()
    this._discardedWhiteCards.clear()

    this.clearTimeouts()

    this._players = this.players.filter((p) => !p.disconnected)

    for (const player of this._players) {
      player.hand.clear()
      player.master = false
      player.voted = false
    }

    this._events.emit("statuschange", this._status)
  }

  public getTimeoutDate(name: keyof Timeouts) {
    return this._timeouts[name]?.date
  }

  public isWaiting() {
    return this._status == "waiting" || this._status == "end"
  }

  public isPlaying() {
    return !this.isWaiting()
  }

  private startVoting(isRepeat?: boolean) {
    if (!this._redDeck) {
      throw new GameError("DeckNotInitialized")
    }

    if (this._redDeck.size == 0) {
      this._redDeck = new Map(this._discardedRedCards)
      this._discardedRedCards.clear()
    }

    this._votes.forEach((vote) => {
      if (isRepeat) {
        const hand = this._players.find(({ id }) => vote.playerId == id)?.hand
        hand?.set(vote.card.id, vote.card.text)
      } else {
        this._discardedWhiteCards.set(vote.card.id, vote.card.text)
      }
    })
    this._votes = []

    this._players.forEach((player) => {
      player.voted = false
    })
    this._status = "voting"

    this.passMaster()

    if (!isRepeat) {
      const [id, redCard] = Array.from(this._redDeck.entries())[
        getRandomInt(0, this._redDeck.size - 1)
      ]
      this._redCard = redCard
      this._redDeck.delete(id)
      this._discardedRedCards.set(id, redCard)

      for (const player of this._players) {
        this.fillPlayerDeck(player)
      }
    }

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

      if (player.hand.size == 0) {
        return
      }

      const cards = Array.from(player.hand.entries())
      const [id, text] = cards[getRandomInt(0, player.hand.size - 1)]

      player.voted = true

      this._votes.push({
        card: {
          id,
          text
        },
        playerId: player.id,
        visible: false,
        winner: false
      })

      player.hand.delete(id)
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

  private buildDeck(variant: "red" | "white") {
    const deck = this._decks[this._configuration.deck]

    if (deck == null) {
      throw new GameError("DeckNotInitialized")
    }

    return new Map(Object.entries(deck[variant]))
  }

  private fillPlayerDeck(player: SessionPlayer) {
    if (!this._whiteDeck) {
      throw new GameError("DeckNotInitialized")
    }

    const handSize = player.hand.size

    for (let i = 0; i < 10 - handSize; i++) {
      if (this._whiteDeck.size == 0) {
        this._whiteDeck = new Map(this._discardedWhiteCards)
        this._discardedWhiteCards.clear()
      }

      const cards = Array.from(this._whiteDeck.entries())
      const [id, text] = cards[getRandomInt(0, this._whiteDeck.size - 1)]

      player.hand.set(id, text)

      this._whiteDeck.delete(id)
    }
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
}

export class SessionFactory implements ISessionFactory {
  private _precollectedDecks: PreCollectedDecks | null = null

  public async init() {
    this._precollectedDecks = await preCollectDecks()
  }

  public create() {
    if (this._precollectedDecks == null) {
      throw new Error("You have to call `init` before calling `create`")
    }

    return new Session(this._precollectedDecks)
  }
}

export default Session
