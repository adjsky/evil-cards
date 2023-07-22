import type { MutableRefObject } from "react"

export type JsonLike = Record<string, unknown>

export type OnCloseDetails = {
  gracefully: boolean
  reconnecting: boolean
}

export type ShouldReconnectDetails = {
  closedGracefully: boolean
  nReconnects: number
}

export type SocketOptions<T = unknown> = {
  url?: string | null
  onJsonMessage?: (message: T) => void
  onOpen?: (event: WebSocketEventMap["open"]) => void
  onError?: (event: WebSocketEventMap["error"]) => void
  onClose?: (event: WebSocketEventMap["close"], details: OnCloseDetails) => void
  shouldReconnect?: (
    error: WebSocketEventMap["close"],
    details: ShouldReconnectDetails
  ) => boolean
}

export type Listener<T = unknown> = {
  id: string
  options: MutableRefObject<SocketOptions<T> | undefined>
}

export type Connection<T = unknown> = {
  instance: WebSocket | null
  heartbeatTimeout: NodeJS.Timeout | null
  reconnectTimeout: NodeJS.Timeout | null
  disconnectTimeout: NodeJS.Timeout | null
  listeners: Listener<T>[]
  closedGracefully: boolean
  nReconnects: number
}
