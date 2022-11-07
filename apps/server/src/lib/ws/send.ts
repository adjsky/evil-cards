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
export type Status =
  | "waiting"
  | "starting"
  | "voting"
  | "choosing"
  | "end"
  | "choosingbest"
export type Vote = { text: string; userId: string; visible: boolean }

export type Created = {
  type: "created"
  details: {
    id: string
    status: Status
    users: User[]
    userId: string
  }
}

export type Joined = {
  type: "joined"
  details: {
    id: string
    status: Status
    users: User[]
    userId: string
    whiteCards: string[]
    redCard: string | null
    votingEndsAt: number | null
  }
}

export type UserJoined = {
  type: "userjoined"
  details: {
    users: User[]
  }
}

export type UserDisconnected = {
  type: "userdisconnected"
  details: { users: User[] }
}

export type Voted = {
  type: "voted"
  details: { users: User[]; votes: Vote[]; whiteCards: string[] }
}

export type GameStart = {
  type: "gamestart"
  details: { status: Status }
}

export type VotingStarted = {
  type: "votingstarted"
  details: {
    status: Status
    whiteCards: string[]
    redCard: string
    users: User[]
    votes: Vote[]
    votingEndsAt: number | null
  }
}

export type ChoosingStarted = {
  type: "choosingstarted"
  details: { status: Status; votes: Vote[]; whiteCards: string[] }
}

export type Choose = {
  type: "choose"
  details: { votes: Vote[] }
}

export type ChoosingBestStarted = {
  type: "choosingbeststarted"
  details: { status: Status }
}
export type GameEnd = {
  type: "gameend"
  details: { status: Status }
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
  | UserJoined
  | UserDisconnected
  | Voted
  | GameStart
  | VotingStarted
  | ChoosingStarted
  | Choose
  | ChoosingBestStarted
  | GameEnd
  | Error
  | Ping
