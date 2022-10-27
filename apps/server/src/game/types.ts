import type Emittery from "emittery"
import type { WebSocket } from "ws"
import type { Message } from "@kado/schemas/dist/server/receive"

import type { MapDiscriminatedUnion, UnwrapField } from "../types/utility"

export type WithWebsocket<T> = {
  [K in keyof T]: T[K] extends undefined
    ? { socket: WebSocket }
    : T[K] & { socket: WebSocket }
}
export type ServerEvent = WithWebsocket<
  UnwrapField<MapDiscriminatedUnion<Message, "type">, "details">
>
export type Emitter = Emittery<
  ServerEvent & { lostconnection: { socket: WebSocket } }
>
