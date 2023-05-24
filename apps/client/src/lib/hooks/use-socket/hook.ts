import { useEffect, useCallback, useRef, useId } from "react"
import attachListeners from "./attach-listeners"

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
  onJsonMessage?: (data: T) => void
  onOpen?: (event: WebSocketEventMap["open"]) => void
  onError?: (event: WebSocketEventMap["error"]) => void
  onClose?: (event: WebSocketEventMap["close"], details: OnCloseDetails) => void
  shouldReconnect?: (details: ShouldReconnectDetails) => boolean
}

export type Listener<T = unknown> = {
  id: string
  options: MutableRefObject<SocketOptions<T> | undefined>
}

export type Connection<T = unknown> = {
  instance: WebSocket | null
  heartbeatTimeout: NodeJS.Timeout | null
  reconnectTimeout: NodeJS.Timeout | null
  listeners: Listener<T>[]
  closedGracefully: boolean
  nReconnects: number
}

const connections = new Map<string, Connection>()

const useSocket = <S = JsonLike, R = JsonLike>(options?: SocketOptions<R>) => {
  const id = useId()

  const connectionRef = useRef<Connection<R> | null>(
    options?.url ? connections.get(options.url) ?? null : null
  )

  const optionsRef = useRef(options)
  optionsRef.current = options

  const connect = useCallback((url: string, connection: Connection<R>) => {
    connection.closedGracefully = false
    connection.instance = new WebSocket(url)

    attachListeners({
      connection,
      onReconnect() {
        connect(url, connection)
      }
    })
  }, [])

  const disconnect = useCallback((connection: Connection<R>) => {
    connection.closedGracefully = true

    if (connection.instance) {
      connection.instance.close()
    }
  }, [])

  const getInstance = useCallback(
    () => connectionRef.current?.instance ?? null,
    []
  )

  const sendJsonMessage = useCallback((data: S) => {
    const connection = connectionRef.current

    if (
      !connection?.instance ||
      connection.instance.readyState != WebSocket.OPEN
    ) {
      throw new Error("WebSocket connection is not ready to send messages")
    } else {
      connection.instance?.send(JSON.stringify(data))
    }
  }, [])

  useEffect(() => {
    if (!options?.url) {
      return
    }

    const connection: Connection<R> = connections.get(options.url) ?? {
      closedGracefully: false,
      heartbeatTimeout: null,
      instance: null,
      listeners: [],
      nReconnects: 0,
      reconnectTimeout: null
    }

    if (!connections.has(options.url)) {
      connections.set(options.url, connection as Connection<unknown>)
    }

    if (!connectionRef.current) {
      connectionRef.current = connection
    }

    connection.listeners.push({
      id,
      options: optionsRef
    })

    const opened = connection.instance?.readyState == WebSocket.OPEN
    const connecting = connection.instance?.readyState == WebSocket.CONNECTING

    if (!opened && !connecting) {
      connect(options.url, connection)
    }

    return () => {
      const nListeners = connection.listeners.length
      if (nListeners == 1) {
        disconnect(connection)
      }

      connection.listeners = connection.listeners.filter(
        (connection) => connection.id != id
      )
    }
  }, [options?.url, connect, disconnect, id])

  return {
    getInstance,
    sendJsonMessage
  }
}

export default useSocket
