import { useEffect, useCallback, useState } from "react"
import { env } from "../env/client.mjs"

type JsonLike = Record<string, unknown>
type SharedWebsocket = {
  instance: WebSocket | null
  nReferences: number
  closeTimeout: NodeJS.Timeout | null
  heartbeatTimeout: NodeJS.Timeout | null
  lastJsonMessage?: JsonLike
}
const sharedWebsocket: SharedWebsocket = {
  instance: null,
  nReferences: 0,
  closeTimeout: null,
  heartbeatTimeout: null
}
type SocketOptions<T> = {
  onJsonMessage?: (data: T) => void
  onError?: (event: WebSocketEventMap["error"]) => void
  onClose?: (event: WebSocketEventMap["close"]) => void
  onConnectionLost?: () => void
}

export const useSocket = <S = JsonLike, R = JsonLike>(
  options?: SocketOptions<R>
) => {
  const [, updateState] = useState({})
  const forceUpdate = useCallback(() => updateState({}), [])

  const heartbeat = useCallback(() => {
    sharedWebsocket.heartbeatTimeout &&
      clearTimeout(sharedWebsocket.heartbeatTimeout)

    sharedWebsocket.heartbeatTimeout = setTimeout(() => {
      options?.onConnectionLost && options.onConnectionLost()
    }, 3000 + 1000)
  }, [options])

  const onClose = useCallback(() => {
    sharedWebsocket.heartbeatTimeout &&
      clearTimeout(sharedWebsocket.heartbeatTimeout)
    sharedWebsocket.heartbeatTimeout = null
  }, [])

  const onMessageCallback = useCallback(
    ({ data }: WebSocketEventMap["message"]) => {
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
      } catch (_) {}
    },
    [forceUpdate, heartbeat]
  )

  useEffect(() => {
    sharedWebsocket.nReferences += 1
    if (sharedWebsocket.closeTimeout) {
      clearTimeout(sharedWebsocket.closeTimeout)
      sharedWebsocket.closeTimeout = null
    }

    if (sharedWebsocket.instance == null) {
      const socket = new WebSocket(env.NEXT_PUBLIC_WS_HOST)
      sharedWebsocket.instance = socket
      sharedWebsocket.instance.addEventListener("open", heartbeat)
      sharedWebsocket.instance.addEventListener("message", onMessageCallback)
      sharedWebsocket.instance.addEventListener("close", onClose)
    }

    return () => {
      sharedWebsocket.nReferences -= 1
      if (sharedWebsocket.nReferences == 0) {
        sharedWebsocket.closeTimeout = setTimeout(() => {
          sharedWebsocket.instance?.close()
          sharedWebsocket.instance?.removeEventListener("open", heartbeat)
          sharedWebsocket.instance?.removeEventListener(
            "message",
            onMessageCallback
          )
          sharedWebsocket.instance?.removeEventListener("close", onClose)
        }, 5000)
      }
    }
  }, [onMessageCallback, heartbeat, onClose])

  useEffect(() => {
    if (sharedWebsocket.instance == null || !options) {
      return
    }

    const jsonMessageCallback = ({ data }: WebSocketEventMap["message"]) => {
      try {
        const parsedData = JSON.parse(data)
        options.onJsonMessage && options.onJsonMessage(parsedData)
      } catch (_) {}
    }

    if (options.onJsonMessage)
      sharedWebsocket.instance.addEventListener("message", jsonMessageCallback)
    if (options.onError)
      sharedWebsocket.instance.addEventListener("error", options.onError)
    if (options.onClose)
      sharedWebsocket.instance.addEventListener("close", options.onClose)

    return () => {
      if (options.onJsonMessage) {
        sharedWebsocket.instance?.removeEventListener(
          "message",
          jsonMessageCallback
        )
      }
      if (options.onError) {
        sharedWebsocket.instance?.removeEventListener("error", options.onError)
      }
      if (options.onClose) {
        sharedWebsocket.instance?.removeEventListener("close", options.onClose)
      }
    }
  }, [options])

  const getInstance = useCallback(() => sharedWebsocket.instance, [])
  const sendJsonMessage = useCallback((data: S) => {
    sharedWebsocket.instance?.send(JSON.stringify(data))
  }, [])

  return {
    getInstance,
    sendJsonMessage,
    lastJsonMessage: sharedWebsocket.lastJsonMessage as R | undefined
  }
}
