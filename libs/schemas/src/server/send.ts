export type User = {
  id: string
  avatarId: number
  username: string
  score: number
  host: boolean
  master: boolean
  voted: boolean
  disconnected: boolean
}
export type Session = {
  id: string
  state: "waiting" | "starting" | "voting" | "choosing" | "end" | "choosingbest"
  users: User[]
  redCard: string | null
  votes: { text: string; userId: string; visible: boolean }[]
}

export type Created = {
  type: "created"
  details: { session: Session; userId: string }
}
export type Joined = {
  type: "joined"
  details: { session: Session; userId: string; whiteCards?: string[] }
}
export type Disconnected = {
  type: "disconnected"
  details: { session: Session }
}
export type Voted = {
  type: "voted"
  details: { session: Session }
}
export type GameStart = {
  type: "gamestart"
  details: { session: Session }
}
export type VotingStarted = {
  type: "votingstarted"
  details: { session: Session; whiteCards: string[] }
}
export type ChoosingStarted = {
  type: "choosingstarted"
  details: { session: Session; whiteCards: string[] }
}
export type Choose = {
  type: "choose"
  details: { session: Session }
}
export type ChoosingBestStarted = {
  type: "choosingbeststarted"
  details: { session: Session }
}
export type GameEnd = {
  type: "gameend"
  details: { session: Session }
}
export type Error = {
  type: "error"
  details?: string
}
export type Ping = {
  type: "ping"
}
export type Message =
  | Created
  | Joined
  | Disconnected
  | Voted
  | GameStart
  | VotingStarted
  | ChoosingStarted
  | Choose
  | ChoosingBestStarted
  | GameEnd
  | Error
  | Ping
