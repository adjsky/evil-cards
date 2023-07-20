import { useCallback, useEffect, useId, useRef } from "react"

import attachListeners from "./attach-listeners"
import * as connections from "./connections"

import type { Connection, JsonLike, SocketOptions } from "./types"

const disconnectTimeoutMs = 2 * 1000 // 2s

const useSocket = <S = JsonLike, R = JsonLike>(options?: SocketOptions<R>) => {
  const id = useId()

  const connectionRef = useRef<Connection<R> | null>(
    options?.url ? connections.get(options.url) : null
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
    if (connection.disconnectTimeout) {
      clearTimeout(connection.disconnectTimeout)
      connection.disconnectTimeout = null
    }

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
      console.error("WebSocket connection is not ready to send messages")

      return
    }

    connection.instance.send(JSON.stringify(data))
  }, [])

  useEffect(() => {
    if (!options?.url) {
      connectionRef.current = null
      return
    }

    const connection: Connection<R> = connections.getOrDefault(options.url)
    if (!connectionRef.current) {
      connectionRef.current = connection
    }

    if (connection.disconnectTimeout) {
      clearTimeout(connection.disconnectTimeout)
      connection.disconnectTimeout = null
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
        connection.disconnectTimeout = setTimeout(() => {
          connection.disconnectTimeout = null
          disconnect(connection)
        }, disconnectTimeoutMs)
      }

      connection.listeners = connection.listeners.filter(
        (connection) => connection.id != id
      )
    }
  }, [options?.url, connect, disconnect, id])

  return {
    getInstance,
    sendJsonMessage,
    close() {
      if (!connectionRef.current) {
        console.error("No connection found to close")

        return
      }

      disconnect(connectionRef.current)
    }
  }
}

export default useSocket
