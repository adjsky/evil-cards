import type Emittery from "emittery"
import type { WebSocket } from "ws"
import type { Message as ReceiveMessage } from "../lib/ws/receive.ts"
import type { Message as SendMessage } from "../lib/ws/send.ts"
import type { DateTimeout } from "../lib/date-timeout.ts"
import type { ReqContext } from "@evil-cards/ctx-log"
import type {
  MapDiscriminatedUnion,
  UnwrapField,
  With
} from "../types/utility.ts"
import type { SendPlayer } from "../lib/ws/send.ts"
import type { ISession } from "./interfaces.ts"

export type ControllerWebSocket = WebSocket & {
  session?: ISession | null
  player?: Player | null
  alive?: boolean
  active?: boolean
}

type WithHelperData<T> = With<
  { socket: ControllerWebSocket; ctx: ReqContext },
  T
>

export type ServerEvent = WithHelperData<
  UnwrapField<MapDiscriminatedUnion<ReceiveMessage, "type">, "details">
>

export type ControllerEvents = Emittery<
  ServerEvent & WithHelperData<{ close: undefined }>
>

export type SessionEvents = Emittery<{
  statuschange: Status
  join: Player
  leave: Player
  sessionend: undefined
  configurationchange: Configuration
  vote: Vote
  choose: Vote
  choosewinner: Vote
  cardsdiscard: Player
}>

export type Player = {
  id: string
  avatarId: number
  nickname: string
  score: number
  host: boolean
  master: boolean
  voted: boolean
  disconnected: boolean
  deck: Card[]
  leaveTimeout: NodeJS.Timeout | null
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

export type Timeouts = Record<
  "voting" | "starting" | "choosebest" | "endsesion",
  null | DateTimeout
>

export type BroadcastCallback = (
  players: SendPlayer[],
  player: Player
) => SendMessage | undefined
