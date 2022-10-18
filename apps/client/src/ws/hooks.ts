import { useEffect, useRef } from "react"
import { env } from "../env/client.mjs"

export const useSocket = () => {
  const socketRef = useRef<WebSocket | null>(null)
  useEffect(() => {
    if (socketRef.current) {
      return
    }

    const socket = new WebSocket(env.NEXT_PUBLIC_WS_HOST)
    socketRef.current = socket

    return () => {
      socketRef.current?.readyState == WebSocket.OPEN &&
        socketRef.current.close()
    }
  }, [])

  return socketRef
}
