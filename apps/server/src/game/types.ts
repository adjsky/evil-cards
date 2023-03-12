import type Emittery from "emittery"
import type { WebSocket } from "ws"
import type { Message } from "../lib/ws/receive"

import type {
  MapDiscriminatedUnion,
  UnwrapField,
  WithWebsocket
} from "../types/utility"

export type ServerEvent = WithWebsocket<
  UnwrapField<MapDiscriminatedUnion<Message, "type">, "details">
>

export type ControllerEvents = Emittery<
  ServerEvent & { lostconnection: { socket: WebSocket } }
>

export type PlayerSender = {
  send: (data: unknown) => void
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
  votingDurationSeconds: number
  reader: "on" | "off"
  maxScore: number
}
