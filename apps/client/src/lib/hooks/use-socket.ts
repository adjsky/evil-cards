import { useEffect, useCallback, useState } from "react"
import { createEventBus } from "@/core/event-bus"

const browser = typeof window != "undefined"

type JsonLike = Record<string, unknown>
type SharedWebsocket = {
  instance: WebSocket | null
  heartbeatTimeout: NodeJS.Timeout | null
  reconnectTimeout: NodeJS.Timeout | null
  lastJsonMessage?: JsonLike
  messageQueue: unknown[]
  disconnectedManually: boolean
  nReconnects: number
}
const sharedWebsocket: SharedWebsocket = {
  instance: null,
  heartbeatTimeout: null,
  reconnectTimeout: null,
  messageQueue: [],
  disconnectedManually: false,
  nReconnects: 0
}
type SocketOptions<T> = {
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

const eventBus = createEventBus<{ connecting: undefined }>()

const useSocket = <S = JsonLike, R = JsonLike>(options?: SocketOptions<R>) => {
  const [, updateState] = useState({})
  const forceUpdate = useCallback(() => updateState({}), [])
  const [listenersTrigger, updateListenersTrigger] = useState({})
  const triggerListeners = useCallback(() => updateListenersTrigger({}), [])

  const connect = useCallback(
    (path: string) => {
      const heartbeat = () => {
        sharedWebsocket.heartbeatTimeout &&
          clearTimeout(sharedWebsocket.heartbeatTimeout)

        sharedWebsocket.heartbeatTimeout = setTimeout(() => {
          sharedWebsocket.instance?.close()
        }, 60000 + 1000)
      }
      const handleOpen = () => {
        sharedWebsocket.nReconnects = 0

        let message = sharedWebsocket.messageQueue.shift()
        while (message != undefined) {
          sharedWebsocket.instance?.send(JSON.stringify(message))
          message = sharedWebsocket.messageQueue.shift()
        }

        heartbeat()
      }
      const handleMessage = ({ data }: WebSocketEventMap["message"]) => {
        try {
          const parsedData = JSON.parse(data)

          // ignore ping messages
          if (parsedData?.type == "ping") {
            sharedWebsocket.instance?.send(JSON.stringify({ type: "pong" }))
            heartbeat()
            return
          }

          sharedWebsocket.lastJsonMessage = parsedData
          forceUpdate()
        } catch (_) {
          //
        }
      }
      const handleClose = () => {
        sharedWebsocket.heartbeatTimeout &&
          clearTimeout(sharedWebsocket.heartbeatTimeout)
        sharedWebsocket.heartbeatTimeout = null

        sharedWebsocket.instance?.removeEventListener("open", handleOpen)
        sharedWebsocket.instance?.removeEventListener("message", handleMessage)
        sharedWebsocket.instance?.removeEventListener("close", handleClose)

        const shouldReconnect =
          options?.shouldReconnect && options.shouldReconnect()

        if (!sharedWebsocket.disconnectedManually && shouldReconnect) {
          sharedWebsocket.reconnectTimeout = setTimeout(() => {
            connect(path)
            sharedWebsocket.reconnectTimeout = null
          }, 2 ** sharedWebsocket.nReconnects * 1000)

          sharedWebsocket.nReconnects += 1
        }
      }

      sharedWebsocket.disconnectedManually = false
      sharedWebsocket.instance = new WebSocket(path)

      sharedWebsocket.instance.addEventListener("open", handleOpen)
      sharedWebsocket.instance.addEventListener("message", handleMessage)
      sharedWebsocket.instance.addEventListener("close", handleClose)

      eventBus.emit("connecting")
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [forceUpdate, options?.shouldReconnect]
  )

  const disconnect = useCallback(() => {
    sharedWebsocket.disconnectedManually = true
    sharedWebsocket.nReconnects = 0

    if (sharedWebsocket.reconnectTimeout) {
      clearTimeout(sharedWebsocket.reconnectTimeout)
      sharedWebsocket.reconnectTimeout = null
    }

    if (sharedWebsocket.instance) {
      sharedWebsocket.instance.close()
      sharedWebsocket.instance = null
    }
  }, [])

  const getInstance = useCallback(() => sharedWebsocket.instance, [])

  const sendJsonMessage = useCallback((data: S) => {
    if (
      !sharedWebsocket.instance ||
      sharedWebsocket.instance.readyState != WebSocket.OPEN
    ) {
      sharedWebsocket.messageQueue.push(data)
    } else {
      sharedWebsocket.instance?.send(JSON.stringify(data))
    }
  }, [])

  const clearMessageQueue = useCallback(() => {
    sharedWebsocket.messageQueue = []
  }, [])

  useEffect(() => {
    if (!options || !sharedWebsocket.instance) {
      return
    }

    const handleOpen = (event: WebSocketEventMap["open"]) => {
      if (options?.onOpen) {
        options.onOpen(event)
      }
    }
    const handleError = (event: WebSocketEventMap["error"]) => {
      if (options?.onError) {
        options.onError(event)
      }
    }
    const handleClose = (event: WebSocketEventMap["close"]) => {
      if (options.onClose) {
        options.onClose(
          event,
          sharedWebsocket.disconnectedManually,
          sharedWebsocket.nReconnects > 0
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

    sharedWebsocket.instance.addEventListener("open", handleOpen)
    sharedWebsocket.instance.addEventListener("error", handleError)
    sharedWebsocket.instance.addEventListener("close", handleClose)
    sharedWebsocket.instance.addEventListener("message", handleJsonMessage)

    return () => {
      sharedWebsocket.instance?.removeEventListener("open", handleOpen)
      sharedWebsocket.instance?.removeEventListener("error", handleError)
      sharedWebsocket.instance?.removeEventListener("close", handleClose)
      sharedWebsocket.instance?.removeEventListener(
        "message",
        handleJsonMessage
      )
    }
  }, [options, listenersTrigger])

  eventBus.useSubscription("connecting", triggerListeners)

  return {
    connect,
    disconnect,
    getInstance,
    sendJsonMessage,
    clearMessageQueue,
    lastJsonMessage: sharedWebsocket.lastJsonMessage as R | undefined,
    connected: browser
      ? sharedWebsocket.instance?.readyState == WebSocket.OPEN
      : false
  }
}

export default useSocket
