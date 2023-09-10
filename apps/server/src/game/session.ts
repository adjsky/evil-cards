import dayjs from "dayjs"
import Emittery from "emittery"
import { nanoid } from "nanoid"

import getRandomInt from "../functions/get-random-int.ts"
import shuffleArray from "../functions/shuffle-array.ts"
import { setDateTimeout } from "../lib/date-timeout.ts"
import { redCards, whiteCards } from "./cards.ts"
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
import {
  DiscardCardsError,
  DisconnectedError,
  ForbiddenNicknameError,
  ForbiddenToChooseError,
  ForbiddenToChooseWinnerError,
  ForbiddenToVoteError,
  GameStartedError,
  HostError,
  InvalidCardError,
  InvalidChoosedPlayerIdError,
  InvalidPlayerIdError,
  NoPlayerError,
  NotEnoughPlayersError,
  NotPlayingError,
  TooManyPlayersError
} from "./errors.ts"

import type { Card, Configuration, Status, Vote } from "../ws/send.ts"
import type { Card as StoredCard } from "./cards.ts"
import type { ISession, ISessionFactory } from "./interfaces.ts"
import type { SessionEvents, SessionPlayer, Timeouts } from "./types.ts"

class Session implements ISession {
  private _id: string
  private _availableRedCards: Card[] | null
  private _availableWhiteCards: Card[] | null
  private _timeouts: Timeouts
  private _votes: Vote[]
  private _players: SessionPlayer[]
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
      clearListeners: this._events.clearListeners.bind(this._events)
    }
  }
  public get configuration() {
    return this._configuration
  }

  public constructor() {
    this._id = nanoid(SESSION_ID_SIZE)
    this._configuration = {
      maxScore: 10,
      reader: true,
      votingDurationSeconds: 60,
      version18Plus: true,
      public: true
    }
    this._availableRedCards = null
    this._availableWhiteCards = null
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
  }

  public join(nickname: string, avatarId: number) {
    const existingPlayer = this._players.find(
      (player) => player.nickname == nickname
    )

    if (existingPlayer) {
      if (!existingPlayer.disconnected && !existingPlayer.leaveTimeout) {
        throw new ForbiddenNicknameError()
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
      throw new TooManyPlayersError()
    }

    const isWaiting = this.isWaiting()
    if (!isWaiting) {
      throw new GameStartedError()
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
      deck: [],
      leaveTimeout: null
    }

    this._players.push(player)
    this._events.emit("join", player)

    return player
  }

  public leave(playerId: string) {
    const player = this._players.find((player) => player.id == playerId)
    if (!player) {
      throw new NoPlayerError()
    }

    if (player.disconnected) {
      throw new DisconnectedError()
    }

    const makeWork = () => {
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

        this.startVoting()
      }

      this._events.emit("leave", player)

      if (isPlaying && remainingPlayers.length < MIN_PLAYERS_TO_START_GAME) {
        this.endGame()
      }
    }

    if (this.isPlaying()) {
      player.leaveTimeout = setTimeout(() => {
        player.leaveTimeout = null
        makeWork()
      }, LEAVE_TIMEOUT_MS)
    } else {
      makeWork()
    }
  }

  public updateConfiguration(playerId: string, configuration: Configuration) {
    const player = this._players.find((p) => p.id == playerId)

    if (!player) {
      throw new NoPlayerError()
    }

    if (!player.host) {
      throw new HostError()
    }

    this._configuration = configuration

    this._events.emit("configurationchange", configuration)
  }

  public startGame(playerId: string) {
    const player = this._players.find((p) => p.id == playerId)

    if (!player) {
      throw new NoPlayerError()
    }

    if (!player.host) {
      throw new HostError()
    }

    if (this.isPlaying()) {
      throw new GameStartedError()
    }

    if (this._players.length < MIN_PLAYERS_TO_START_GAME) {
      throw new NotEnoughPlayersError()
    }

    this._status = "starting"

    this._availableRedCards = this.reduceCards(redCards)
    this._availableWhiteCards = this.reduceCards(whiteCards)

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
    const card = player?.deck.find((deckCard) => deckCard.id == cardId)

    if (!player) {
      throw new InvalidPlayerIdError()
    }

    if (!card) {
      throw new InvalidCardError()
    }

    if (this._status != "voting" || player.master || player.voted) {
      throw new ForbiddenToVoteError()
    }

    player.voted = true
    player.deck = player.deck.filter((deckCard) => deckCard.id != cardId)

    const vote: Vote = {
      text: card.text,
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
      throw new InvalidPlayerIdError()
    }

    if (!choosedVote) {
      throw new InvalidChoosedPlayerIdError()
    }

    if (this._status != "choosing" || !player.master) {
      throw new ForbiddenToChooseError()
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
      throw new InvalidPlayerIdError()
    }

    if (!choosedPlayer || !choosedVote) {
      throw new InvalidChoosedPlayerIdError()
    }

    if (!player.master || this._status != "choosingwinner") {
      throw new ForbiddenToChooseWinnerError()
    }

    choosedPlayer.score += 1
    choosedVote.winner = true

    this._events.emit("choosewinner", choosedVote)

    const didPlayerWin = choosedPlayer.score >= this._configuration.maxScore
    this.startWinnerCardView(didPlayerWin)
  }

  public discardCards(playerId: string) {
    if (this.isWaiting()) {
      throw new NotPlayingError()
    }

    const player = this._players.find((p) => p.id == playerId)

    if (!player) {
      throw new InvalidPlayerIdError()
    }

    if (player.score == 0) {
      throw new DiscardCardsError()
    }

    if (!this._availableWhiteCards) {
      throw new Error("Received null availableWhiteCards")
    }

    this._availableWhiteCards = this._availableWhiteCards.concat(player.deck)
    player.deck = []
    player.score -= 1

    this.fillPlayerDeck(player)

    this._events.emit("cardsdiscard", player)
  }

  public endGame() {
    this._status = "end"
    this._redCard = null
    this._votes = []
    this._availableRedCards = null
    this._availableWhiteCards = null

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

  public isWaiting() {
    return this._status == "waiting" || this._status == "end"
  }

  public isPlaying() {
    return !this.isWaiting()
  }

  private startVoting() {
    if (!this._availableRedCards) {
      throw new Error("Received null availableRedCards")
    }

    if (this._availableRedCards.length == 0) {
      return this.endGame()
    }

    this._votes = []
    this._players.forEach((player) => {
      player.voted = false
    })
    this._status = "voting"

    this.passMaster()

    const redCardIndex = getRandomInt(0, this._availableRedCards.length - 1)
    this._redCard = this._availableRedCards[redCardIndex].text
    this._availableRedCards.splice(redCardIndex, 1)

    for (const player of this._players) {
      this.fillPlayerDeck(player)
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

      if (player.deck.length == 0) {
        return
      }

      const randomIndex = getRandomInt(0, player.deck.length - 1)
      const whiteCard = player.deck[randomIndex]

      player.voted = true

      this._votes.push({
        text: whiteCard.text,
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

  private reduceCards(cards: StoredCard[]) {
    return cards.reduce((acc, current, index) => {
      let card = this._configuration.version18Plus
        ? current.adult
        : current.baby

      if (!card) {
        card = current.adult
      }

      acc.push({
        id: index.toString(),
        text: card
      })

      return acc
    }, [] as Card[])
  }

  private fillPlayerDeck(player: SessionPlayer) {
    if (!this._availableWhiteCards) {
      throw new Error("Received null availableWhiteCards")
    }

    const deckLength = player.deck.length

    for (let i = 0; i < 10 - deckLength; i++) {
      if (this._availableWhiteCards.length == 0) {
        break
      }

      const randomIndex = getRandomInt(0, this._availableWhiteCards.length - 1)

      const whiteCard = this._availableWhiteCards[randomIndex]
      player.deck.push(whiteCard)

      this._availableWhiteCards.splice(randomIndex, 1)
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
  public create() {
    return new Session()
  }
}

export default Session
