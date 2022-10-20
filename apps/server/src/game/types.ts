import type Emittery from "emittery"
import type { WebSocket } from "ws"
import type { Message } from "@kado/schemas/dist/server/receive"

import type { MapDiscriminatedUnion, UnwrapField } from "../types/utility"

export type User = {
  id: string
  avatarId: number
  username: string
  score: number
  host: boolean
  master: boolean
  voted: boolean
  disconnected: boolean
  _whiteCards: string[]
  _socket: WebSocket
}

export type Session = {
  id: string
  state: "waiting" | "starting" | "voting" | "choosing" | "choosingbest" | "end"
  users: User[]
  redCard: string | null
  votes: { text: string; userId: string; visible: boolean }[]
  _availableWhiteCards: string[]
  _availableRedCards: string[]
  _masterIndex: number
  _countdownTimeout: NodeJS.Timeout | null
}

export type WithWebsocket<T> = {
  [K in keyof T]: T[K] extends undefined
    ? { socket: WebSocket }
    : T[K] & { socket: WebSocket }
}
export type ServerEvent = WithWebsocket<
  UnwrapField<MapDiscriminatedUnion<Message, "type">, "details">
>
export type Emitter = Emittery<ServerEvent & { closed: { socket: WebSocket } }>
