export type Player = {
  id: string
  avatarId: number
  nickname: string
  score: number
  host: boolean
  master: boolean
  voted: boolean
  disconnected: boolean
}

export type Card = {
  id: string
  text: string
}

export type Status =
  | "waiting"
  | "starting"
  | "voting"
  | "choosing"
  | "end"
  | "choosingwinner"
  | "winnercardview"

export type Vote = {
  text: string
  playerId: string
  visible: boolean
  winner: boolean
}

export type Configuration = {
  votingDurationSeconds: 30 | 60 | 90
  reader: boolean
  maxScore: 10 | 15 | 20
  version18Plus: boolean
  public: boolean
}

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

export type Created = {
  type: "create"
  details: {
    changedState: {
      id: string
      status: "waiting"
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
      players: Player[]
      playerId: string
      configuration: Configuration
    } & (
      | { status: Extract<Status, "waiting" | "end" | "starting"> }
      | {
          status: Exclude<Status, "waiting" | "end" | "starting">
          deck: Card[]
          redCard: string
          votingEndsAt: number | null
          votes: Vote[]
        }
    )
  }
}

export type PlayerJoined = {
  type: "playerjoin"
  details: {
    changedState: {
      players: Player[]
    }
  }
}

export type PlayerLeaved = {
  type: "playerleave"
  details: { changedState: { players: Player[] } }
}

export type Voted = {
  type: "vote"
  details: {
    changedState: { players: Player[]; votes: Vote[]; deck: Card[] }
  }
}

export type GameStart = {
  type: "gamestart"
  details: { changedState: { status: "starting" } }
}

export type VotingStarted = {
  type: "votingstart"
  details: {
    changedState: {
      status: "voting"
      deck: Card[]
      redCard: string
      players: Player[]
      votes: Vote[]
      votingEndsAt: number
    }
  }
}

export type ChoosingStarted = {
  type: "choosingstart"
  details: {
    changedState: { status: "choosing"; votes: Vote[]; deck: Card[] }
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
  details: { changedState: { status: "choosingwinner" } }
}

export type ChooseWinner = {
  type: "choosewinner"
  details: {
    changedState: { votes: Vote[]; players: Player[] }
  }
}

export type WinnerCardView = {
  type: "winnercardview"
  details: {
    changedState: { status: "winnercardview" }
  }
}

export type GameEnd = {
  type: "gameend"
  details: { changedState: { status: "end"; players: Player[] } }
}

export type DiscardCards = {
  type: "discardcards"
  details: {
    changedState: {
      players: Player[]
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

export type Chat = {
  type: "chat"
  details: {
    message: string
    id: string
  } & Pick<Player, "avatarId" | "nickname">
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
  | Chat
