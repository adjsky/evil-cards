import type {
  Vote,
  Player,
  Configuration,
  Status,
  SessionEvents,
  PlayerSender,
  Timeouts
} from "./types.ts"

type PublicEvents = {
  on: SessionEvents["on"]
  off: SessionEvents["off"]
  clearListeners: SessionEvents["clearListeners"]
}

export interface ISession {
  votes: Vote[]
  players: Player[]
  id: string
  redCard: string | null
  status: Status
  events: PublicEvents
  configuration: Configuration

  join(
    sender: PlayerSender,
    nickname: string,
    avatarId: number,
    host: boolean
  ): Player
  leave(playerId: string): void
  updateConfiguration(playerId: string, configuration: Configuration): void
  startGame(playerId: string): void
  vote(playerId: string, cardId: string): void
  choose(playerId: string, choosedPlayerId: string): void
  chooseWinner(playerId: string, choosedPlayerId: string): void
  discardCards(playerId: string): void
  endGame(): void
  getTimeoutDate(name: keyof Timeouts): Date | undefined
}

export interface ISessionFactory {
  create(): ISession
}

export interface ISessionManager {
  create(): ISession
  delete(id: string): boolean
  get(id: string): ISession | undefined
}
