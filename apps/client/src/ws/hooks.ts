import { useEffect, useCallback } from "react"
import { env } from "../env/client.mjs"

type JsonLike = Record<string, unknown>
type SharedWebsocket = {
  instance: WebSocket | null
  nReferences: number
  closeTimeout: NodeJS.Timeout | null
  lastJsonMessage?: JsonLike
}
const sharedWebsocket: SharedWebsocket = {
  instance: null,
  nReferences: 0,
  closeTimeout: null
}
type SocketOptions<T> = {
  onJsonMessage: (data: T) => void
}

export const useSocket = <S = JsonLike, R = JsonLike>(
  options?: SocketOptions<R>
) => {
  useEffect(() => {
    sharedWebsocket.nReferences += 1
    if (sharedWebsocket.closeTimeout) {
      clearTimeout(sharedWebsocket.closeTimeout)
    }

    const onMessageCallback = ({ data }: WebSocketEventMap["message"]) => {
      try {
        const parsedData = JSON.parse(data)
        sharedWebsocket.lastJsonMessage = parsedData
      } catch (_) {}
    }

    if (sharedWebsocket.instance == null) {
      const socket = new WebSocket(env.NEXT_PUBLIC_WS_HOST)
      sharedWebsocket.instance = socket

      sharedWebsocket.instance.addEventListener("message", onMessageCallback)
    }

    return () => {
      sharedWebsocket.instance?.removeEventListener(
        "message",
        onMessageCallback
      )

      sharedWebsocket.nReferences -= 1
      if (sharedWebsocket.nReferences == 0) {
        sharedWebsocket.closeTimeout = setTimeout(
          () => sharedWebsocket.instance?.close(),
          5000
        )
      }
    }
  }, [])

  useEffect(() => {
    if (sharedWebsocket.instance == null || !options) {
      return
    }

    const jsonMessageCallback = ({ data }: WebSocketEventMap["message"]) => {
      try {
        const parsedData = JSON.parse(data)
        options.onJsonMessage(parsedData)
      } catch (_) {}
    }

    sharedWebsocket.instance.addEventListener("message", jsonMessageCallback)

    return () => {
      sharedWebsocket.instance?.removeEventListener(
        "message",
        jsonMessageCallback
      )
    }
  }, [options])

  const getInstance = useCallback(() => sharedWebsocket.instance, [])
  const sendJsonMessage = useCallback((data: S) => {
    sharedWebsocket.instance?.send(JSON.stringify(data))
  }, [])

  return {
    getInstance,
    sendJsonMessage,
    lastJsonMessage: sharedWebsocket.lastJsonMessage as R
  }
}
