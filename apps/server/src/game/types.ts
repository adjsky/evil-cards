import type { DateTimeout } from "../lib/date-timeout.ts"
import type {
  MapDiscriminatedUnion,
  UnwrapField,
  With
} from "../types/utility.ts"
import type { Message as ReceiveMessage } from "../ws/receive.ts"
import type { Player, Message as SendMessage } from "../ws/send.ts"
import type { ISession } from "./interfaces.ts"
import type {
  AvailableDeckNames,
  CustomDeckName
} from "@evil-cards/core/deck-parser"
import type Emittery from "emittery"
import type { WebSocket } from "ws"

export type ControllerWebSocket = WebSocket & {
  session?: ISession | null
  player?: SessionPlayer | null
  alive?: boolean
  active?: boolean
}

type WithHelperData<T> = With<{ socket: ControllerWebSocket }, T>

export type ServerEvent = WithHelperData<
  UnwrapField<MapDiscriminatedUnion<ReceiveMessage, "type">, "details">
>

export type ControllerEvents = Emittery<
  ServerEvent & WithHelperData<{ close: undefined }>
>

export type SessionEvents = Emittery<{
  statuschange: Status
  join: SessionPlayer
  leave: SessionPlayer
  sessionend: undefined
  configurationchange: Configuration
  vote: Vote
  choose: Vote
  choosewinner: Vote
  cardsdiscard: SessionPlayer
}>

export type Configuration = {
  votingDurationSeconds: 30 | 60 | 90
  reader: boolean
  maxScore: 10 | 15 | 20
  deck: AvailableDeckNames | CustomDeckName
  public: boolean
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
  card: {
    id: string
    text: string
  }
  playerId: string
  visible: boolean
  winner: boolean
}

export type SessionPlayer = Player & {
  leaveTimeout: NodeJS.Timeout | null
  hand: Map<string, string>
}

export type Timeouts = Record<
  "voting" | "starting" | "choosebest" | "endsesion",
  null | DateTimeout
>

export type BroadcastCallback = (
  players: Player[],
  player: SessionPlayer
) => SendMessage | undefined
