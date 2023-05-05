import { useEffect, useCallback, useState, useRef, useId } from "react"
import { createEventBus } from "@/core/event-bus"

type JsonLike = Record<string, unknown>

export type SocketOptions<T = unknown> = {
  url?: string | null
  onJsonMessage?: (data: T) => void
  onOpen?: (event: WebSocketEventMap["open"]) => void
  onError?: (event: WebSocketEventMap["error"]) => void
  onClose?: (
    event: WebSocketEventMap["close"],
    manually?: boolean,
    reconnecting?: boolean
  ) => void
  shouldReconnect?: () => boolean
}

type Listener = {
  id: string
  shouldReconnect: SocketOptions["shouldReconnect"]
}

type Connection = {
  instance: WebSocket | null
  heartbeatTimeout: NodeJS.Timeout | null
  reconnectTimeout: NodeJS.Timeout | null
  lastJsonMessage?: JsonLike
  listeners: Listener[]
  disconnectedManually: boolean
  nReconnects: number
  eventBus: ReturnType<typeof createEventBus<{ connecting: undefined }>>
}

const connections = new Map<string, Connection>()

const useSocket = <S = JsonLike, R = JsonLike>(options?: SocketOptions<R>) => {
  const id = useId()

  const [, updateState] = useState({})
  const [listenersTrigger, updateListenersTrigger] = useState({})

  const forceUpdate = useCallback(() => updateState({}), [])
  const triggerListeners = useCallback(() => updateListenersTrigger({}), [])

  const connectionRef = useRef<Connection | null>(
    options?.url ? connections.get(options.url) ?? null : null
  )
  const messageQueueRef = useRef<unknown[]>([])

  const connect = useCallback(
    (url: string, connection: Connection) => {
      const heartbeat = () => {
        if (connection.heartbeatTimeout) {
          clearTimeout(connection.heartbeatTimeout)
        }

        connection.heartbeatTimeout = setTimeout(() => {
          connection.instance?.close()
        }, 60000 + 1000)
      }
      const handleOpen = () => {
        connection.nReconnects = 0

        heartbeat()
      }
      const handleMessage = ({ data }: WebSocketEventMap["message"]) => {
        try {
          const parsedData = JSON.parse(data)

          // ignore ping messages
          if (parsedData?.type == "ping") {
            connection.instance?.send(JSON.stringify({ type: "pong" }))
            heartbeat()
            return
          }

          connection.lastJsonMessage = parsedData
          forceUpdate()
        } catch (_) {
          //
        }
      }
      const handleClose = () => {
        if (connection.heartbeatTimeout) {
          clearTimeout(connection.heartbeatTimeout)
        }
        connection.heartbeatTimeout = null

        connection.instance?.removeEventListener("open", handleOpen)
        connection.instance?.removeEventListener("message", handleMessage)
        connection.instance?.removeEventListener("close", handleClose)

        const shouldReconnect = connection.listeners.every((listener) =>
          listener.shouldReconnect ? listener.shouldReconnect() : true
        )

        if (!connection.disconnectedManually && shouldReconnect) {
          connection.reconnectTimeout = setTimeout(() => {
            connect(url, connection)
            connection.reconnectTimeout = null
          }, 2 ** connection.nReconnects * 1000)

          connection.nReconnects += 1
        }
      }

      connection.disconnectedManually = false
      connection.instance = new WebSocket(url)

      connection.instance.addEventListener("open", handleOpen)
      connection.instance.addEventListener("message", handleMessage)
      connection.instance.addEventListener("close", handleClose)

      connection.eventBus.emit("connecting")
    },
    [forceUpdate]
  )

  const disconnect = useCallback((connection: Connection) => {
    connection.disconnectedManually = true
    connection.nReconnects = 0

    if (connection.reconnectTimeout) {
      clearTimeout(connection.reconnectTimeout)
      connection.reconnectTimeout = null
    }

    if (connection.instance) {
      connection.instance.close()
      connection.instance = null
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
      messageQueueRef.current.push(data)
    } else {
      connection.instance?.send(JSON.stringify(data))
    }
  }, [])

  const clearMessageQueue = useCallback(() => {
    messageQueueRef.current = []
  }, [])

  useEffect(() => {
    if (!options?.url) {
      return
    }

    const connection: Connection = connections.get(options.url) ?? {
      disconnectedManually: false,
      eventBus: createEventBus(),
      heartbeatTimeout: null,
      instance: null,
      listeners: [],
      nReconnects: 0,
      reconnectTimeout: null
    }

    if (!connections.has(options.url)) {
      connections.set(options.url, connection)
    }

    if (!connectionRef.current) {
      connectionRef.current = connection
    }

    if (!connection.instance) {
      connect(options.url, connection)
    }

    return () => {
      const nListeners = connection.listeners.length

      if (nListeners == 1) {
        disconnect(connection)
      }
    }
  }, [options?.url, connect, disconnect, id])

  useEffect(() => {
    const connection = connectionRef.current
    if (!connection) {
      return
    }

    connection.listeners.push({
      id,
      shouldReconnect: options?.shouldReconnect
    })

    return () => {
      connection.listeners = connection.listeners.filter(
        (connection) => connection.id != id
      )
    }
  }, [options, id])

  useEffect(() => {
    const connection = connectionRef.current

    if (!options || !connection?.instance) {
      return
    }

    const handleOpen = (event: WebSocketEventMap["open"]) => {
      let message = messageQueueRef.current.shift()
      while (message != undefined) {
        connection.instance?.send(JSON.stringify(message))
        message = messageQueueRef.current.shift()
      }

      if (options.onOpen) {
        options.onOpen(event)
      }
    }
    const handleError = (event: WebSocketEventMap["error"]) => {
      if (options.onError) {
        options.onError(event)
      }
    }
    const handleClose = (event: WebSocketEventMap["close"]) => {
      if (options.onClose) {
        options.onClose(
          event,
          connection.disconnectedManually,
          connection.nReconnects > 0
        )
      }
    }
    const handleJsonMessage = ({ data }: WebSocketEventMap["message"]) => {
      try {
        const parsedData = JSON.parse(data)
        if (options.onJsonMessage) {
          options.onJsonMessage(parsedData)
        }
      } catch (_) {
        //
      }
    }

    connection.instance.addEventListener("open", handleOpen)
    connection.instance.addEventListener("error", handleError)
    connection.instance.addEventListener("close", handleClose)
    connection.instance.addEventListener("message", handleJsonMessage)

    return () => {
      connection.instance?.removeEventListener("open", handleOpen)
      connection.instance?.removeEventListener("error", handleError)
      connection.instance?.removeEventListener("close", handleClose)
      connection.instance?.removeEventListener("message", handleJsonMessage)
    }
  }, [options, listenersTrigger])

  useEffect(() => {
    const connection = connectionRef.current

    if (!connection) {
      return
    }

    connection.eventBus.subscribe("connecting", triggerListeners)

    return () => {
      connection.eventBus.unsubscribe("connecting", triggerListeners)
    }
  })

  return {
    getInstance,
    sendJsonMessage,
    clearMessageQueue,
    lastJsonMessage: connectionRef.current?.lastJsonMessage as R | undefined
  }
}

export default useSocket
