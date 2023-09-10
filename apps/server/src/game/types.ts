import type { DateTimeout } from "../lib/date-timeout.ts"
import type {
  MapDiscriminatedUnion,
  UnwrapField,
  With
} from "../types/utility.ts"
import type { Message as ReceiveMessage } from "../ws/receive.ts"
import type {
  Card,
  Configuration,
  Player,
  Message as SendMessage,
  Status,
  Vote
} from "../ws/send.ts"
import type { ISession } from "./interfaces.ts"
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

export type SessionPlayer = Player & {
  leaveTimeout: NodeJS.Timeout | null
  deck: Card[]
}

export type Timeouts = Record<
  "voting" | "starting" | "choosebest" | "endsesion",
  null | DateTimeout
>

export type BroadcastCallback = (
  players: Player[],
  player: SessionPlayer
) => SendMessage | undefined
