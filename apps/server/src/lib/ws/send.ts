import type { Status, Player, Configuration, Vote } from "../../game/types"

export type Created = {
  type: "create"
  details: {
    changedState: {
      id: string
      status: Status
      players: Player[]
      playerId: string
      configuration: Configuration
    }
  }
}

export type Joined = {
  type: "join"
  details: {
    changedState: {
      id: string
      status: Status
      players: Player[]
      playerId: string
      deck: string[]
      redCard: string | null
      votingEndsAt: number | null
      configuration: Configuration
    }
  }
}

export type UserJoined = {
  type: "playerjoin"
  details: {
    changedState: {
      players: Player[]
    }
  }
}

export type UserDisconnected = {
  type: "playerdisconnect"
  details: { changedState: { players: Player[] } }
}

export type Voted = {
  type: "vote"
  details: {
    changedState: { players: Player[]; votes: Vote[]; deck: string[] }
  }
}

export type GameStart = {
  type: "gamestart"
  details: { changedState: { status: Status } }
}

export type VotingStarted = {
  type: "votingstart"
  details: {
    changedState: {
      status: Status
      deck: string[]
      redCard: string
      players: Player[]
      votes: Vote[]
      votingEndsAt: number | null
    }
  }
}

export type ChoosingStarted = {
  type: "choosingstart"
  details: {
    changedState: { status: Status; votes: Vote[]; deck: string[] }
  }
}

export type Choose = {
  type: "choose"
  details: {
    changedState: { votes: Vote[] }
    choosedUserId: string
  }
}

export type ChoosingWinnerStarted = {
  type: "choosingwinnerstart"
  details: { changedState: { status: Status } }
}

export type ChooseWinner = {
  type: "choosewinner"
  details: {
    changedState: { status: Status; votes: Vote[]; players: Player[] }
  }
}

export type GameEnd = {
  type: "gameend"
  details: { changedState: { status: Status; players: Player[] } }
}

export type Error = {
  type: "error"
  details?: string
}

export type Ping = {
  type: "ping"
}

export type ConfigurationUpdated = {
  type: "configurationupdate"
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
  | ChoosingWinnerStarted
  | ChooseWinner
  | GameEnd
  | Error
  | Ping
  | ConfigurationUpdated
