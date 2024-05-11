import type {
  Configuration,
  SessionEvents,
  SessionPlayer,
  Status,
  Timeouts,
  Vote
} from "./types.ts"
import type { UploadedDeck } from "@evil-cards/core/deck-parser"

type PublicEvents = {
  on: SessionEvents["on"]
  off: SessionEvents["off"]
  clearListeners: SessionEvents["clearListeners"]
}

export interface ISession {
  votes: Vote[]
  players: SessionPlayer[]
  id: string
  redCard: string | null
  status: Status
  events: PublicEvents
  configuration: Configuration

  join(nickname: string, avatarId: number): SessionPlayer
  leave(playerId: string, isKick: boolean): void
  updateConfiguration(playerId: string, configuration: Configuration): void
  addCustomDeck(playerId: string, deck: UploadedDeck): void
  startGame(playerId: string): void
  vote(playerId: string, cardId: string): void
  choose(playerId: string, choosedPlayerId: string): void
  chooseWinner(playerId: string, choosedPlayerId: string): void
  discardCards(playerId: string): void
  endGame(): void
  getTimeoutDate(name: keyof Timeouts): Date | undefined
  isPlaying(): boolean
  isWaiting(): boolean
}

export interface ISessionFactory {
  init(): Promise<void>
  create(): ISession
}

export interface ISessionManager {
  create(): ISession
  delete(id: string): boolean
  get(id: string): ISession | undefined
  getAll(): ISession[]
}
