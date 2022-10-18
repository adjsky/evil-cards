export type User = {
  id: string
  username: string
  score: number
  host: boolean
  master: boolean
  voted: boolean
  disconnected: boolean
}
export type Session = {
  id: string
  state: "waiting" | "voting" | "choosing" | "end"
  users: User[]
  redCard: string | null
  votes: { card: string; userId: string; visible: boolean }[]
}

export type Created = {
  type: "created"
  details: { session: Session }
}
export type Joined = {
  type: "joined"
  details: { session: Session }
}
export type Voted = {
  type: "voted"
  details: { session: Session }
}
export type VotingStarted = {
  type: "votingstarted"
  details: { session: Session; whiteCards: string[]; timeLeft: number }
}
export type ChoosingStarted = {
  type: "choosingstarted"
  details: { session: Session }
}
export type Choose = {
  type: "choose"
  details: { session: Session }
}
export type GameEnd = {
  type: "gameend"
}
export type Error = {
  type: "error"
  details?: string
}
export type Message =
  | Created
  | Joined
  | Voted
  | VotingStarted
  | ChoosingStarted
  | Choose
  | GameEnd
  | Error
