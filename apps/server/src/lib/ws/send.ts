import type {
  Card,
  Configuration,
  Player as GamePlayer,
  Status,
  Vote
} from "../../game/types.ts"

export type AvailableSession = {
  id: string
  server: number
  playing: boolean
  players: number
  hostNickname: string
  hostAvatarId: number
  adultOnly: boolean
  speed: "normal" | "fast" | "slow"
  public: boolean
}

export type SendPlayer = Omit<GamePlayer, "sender" | "deck" | "leaveTimeout">

export type Created = {
  type: "create"
  details: {
    changedState: {
      id: string
      status: Status
      players: SendPlayer[]
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
      players: SendPlayer[]
      playerId: string
      deck: Card[]
      redCard: string | null
      votingEndsAt: number | null
      configuration: Configuration
      votes: Vote[]
    }
  }
}

export type PlayerJoined = {
  type: "playerjoin"
  details: {
    changedState: {
      players: SendPlayer[]
    }
  }
}

export type PlayerLeaved = {
  type: "playerleave"
  details: { changedState: { players: SendPlayer[] } }
}

export type Voted = {
  type: "vote"
  details: {
    changedState: { players: SendPlayer[]; votes: Vote[]; deck: Card[] }
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
      deck: Card[]
      redCard: string
      players: SendPlayer[]
      votes: Vote[]
      votingEndsAt: number | null
    }
  }
}

export type ChoosingStarted = {
  type: "choosingstart"
  details: {
    changedState: { status: Status; votes: Vote[]; deck: Card[] }
  }
}

export type Choose = {
  type: "choose"
  details: {
    changedState: { votes: Vote[] }
    choosedPlayerId: string
  }
}

export type ChoosingWinnerStarted = {
  type: "choosingwinnerstart"
  details: { changedState: { status: Status } }
}

export type ChooseWinner = {
  type: "choosewinner"
  details: {
    changedState: { votes: Vote[]; players: SendPlayer[] }
  }
}

export type WinnerCardView = {
  type: "winnercardview"
  details: {
    changedState: { status: Status }
  }
}

export type GameEnd = {
  type: "gameend"
  details: { changedState: { status: Status; players: SendPlayer[] } }
}

export type DiscardCards = {
  type: "discardcards"
  details: {
    changedState: {
      players: SendPlayer[]
      deck?: Card[]
    }
  }
}

export type Error = {
  type: "error"
  details?: string
}

export type Ping = {
  type: "ping"
}

export type ConfigurationChanged = {
  type: "configurationchange"
  details: { changedState: { configuration: Configuration } }
}

export type Message =
  | Created
  | Joined
  | PlayerJoined
  | PlayerLeaved
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
  | ConfigurationChanged
  | WinnerCardView
  | DiscardCards

export type { Status, Configuration, Vote, Card } from "../../game/types"
export type Player = SendPlayer
