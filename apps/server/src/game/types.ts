import type Emittery from "emittery"
import type { WebSocket } from "ws"
import type { Message } from "../lib/ws/receive"
import type { DateTimeout } from "../lib/date-timeout"
import type { ReqContext } from "../context"

import type { MapDiscriminatedUnion, UnwrapField, With } from "../types/utility"

type WithHelperData<T> = With<{ socket: WebSocket; ctx: ReqContext }, T>

export type ServerEvent = WithHelperData<
  UnwrapField<MapDiscriminatedUnion<Message, "type">, "details">
>

export type ControllerEvents = Emittery<
  ServerEvent & WithHelperData<{ lostconnection: undefined; close: undefined }>
>

export type PlayerSender = {
  send: (data: string) => void
}

export type SessionEvents = Emittery<{
  statuschange: Status
  join: Player
  leave: Player
  sessionend: undefined
  configurationchange: Configuration
  vote: Vote
  choose: Vote
  choosewinner: Vote
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
  deck: string[]
  sender: PlayerSender
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
  reader: "on" | "off"
  maxScore: 10 | 15 | 20
}

export type Timeouts = Record<
  "voting" | "starting" | "choosebest",
  null | DateTimeout
>
