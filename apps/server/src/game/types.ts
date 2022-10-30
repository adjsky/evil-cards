import type Emittery from "emittery"
import type { WebSocket } from "ws"
import type { Message } from "../ws/receive"

import type {
  MapDiscriminatedUnion,
  UnwrapField,
  WithWebsocket
} from "../types/utility"

export type ServerEvent = WithWebsocket<
  UnwrapField<MapDiscriminatedUnion<Message, "type">, "details">
>
export type ControllerEventBus = Emittery<
  ServerEvent & { lostconnection: { socket: WebSocket } }
>
export type SessionEventBus = Emittery<{
  starting: undefined
  voting: undefined
  choosing: undefined
  choosingbest: undefined
  end: undefined
}>
