import type { Configuration } from "./receive"

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
  | "bestcardview"
export type Vote = {
  text: string
  userId: string
  visible: boolean
  winner: boolean
}

export type Created = {
  type: "created"
  details: {
    changedState: {
      id: string
      status: Status
      users: User[]
      userId: string
      configuration: Configuration
    }
  }
}

export type Joined = {
  type: "joined"
  details: {
    changedState: {
      id: string
      status: Status
      users: User[]
      userId: string
      whiteCards: string[]
      redCard: string | null
      votingEndsAt: number | null
      configuration: Configuration
    }
  }
}

export type UserJoined = {
  type: "userjoined"
  details: {
    changedState: {
      users: User[]
    }
  }
}

export type UserDisconnected = {
  type: "userdisconnected"
  details: { changedState: { users: User[] } }
}

export type Voted = {
  type: "voted"
  details: {
    changedState: { users: User[]; votes: Vote[]; whiteCards: string[] }
  }
}

export type GameStart = {
  type: "gamestart"
  details: { changedState: { status: Status } }
}

export type VotingStarted = {
  type: "votingstarted"
  details: {
    changedState: {
      status: Status
      whiteCards: string[]
      redCard: string
      users: User[]
      votes: Vote[]
      votingEndsAt: number | null
    }
  }
}

export type ChoosingStarted = {
  type: "choosingstarted"
  details: {
    changedState: { status: Status; votes: Vote[]; whiteCards: string[] }
  }
}

export type Choose = {
  type: "choose"
  details: {
    changedState: { votes: Vote[] }
    choosedUserId: string
  }
}

export type ChoosingBestStarted = {
  type: "choosingbeststarted"
  details: { changedState: { status: Status } }
}

export type ChooseBest = {
  type: "choosebest"
  details: { changedState: { status: Status; votes: Vote[]; users: User[] } }
}

export type GameEnd = {
  type: "gameend"
  details: { changedState: { status: Status; users: User[] } }
}

export type Error = {
  type: "error"
  details?: string
}

export type Ping = {
  type: "ping"
}

export type ConfigurationUpdated = {
  type: "configurationupdated"
  details: { changedState: { configuration: Configuration } }
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
  | ChooseBest
  | GameEnd
  | Error
  | Ping
  | ConfigurationUpdated

export type { Configuration } from "./receive"
