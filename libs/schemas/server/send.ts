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
  state: "waiting" | "voting" | "choosing" | "end" | "choosingbest"
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
  details: { session: Session; userId: string }
}
export type Voted = {
  type: "voted"
  details: { session: Session }
}
export type VotingStarted = {
  type: "votingstarted"
  details: { session: Session; whiteCards: string[] }
}
export type VotingTimeLeft = {
  type: "votingtimeleft"
  details: {
    secondsLeft: number
  }
}
export type ChoosingStarted = {
  type: "choosingstarted"
  details: { session: Session }
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
  | VotingTimeLeft
  | ChoosingStarted
  | Choose
  | ChoosingBestStarted
  | GameEnd
  | Error
