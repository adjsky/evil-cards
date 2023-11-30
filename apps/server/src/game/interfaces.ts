import type { Configuration, Status, Vote } from "../ws/send.ts"
import type { SessionEvents, SessionPlayer, Timeouts } from "./types.ts"

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
  leave(playerId: string): void
  updateConfiguration(playerId: string, configuration: Configuration): void
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
  create(): ISession
}

export interface ISessionManager {
  create(): ISession
  delete(id: string): boolean
  get(id: string): ISession | undefined
  getAll(): ISession[]
}
