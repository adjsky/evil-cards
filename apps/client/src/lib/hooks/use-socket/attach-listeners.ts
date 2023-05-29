import type { Connection } from "./types"

type Options<T> = {
  connection: Connection<T>
  onReconnect?: () => void
}

function attachListeners<T>({ connection, onReconnect }: Options<T>) {
  if (!connection.instance) {
    return
  }

  const heartbeat = () => {
    if (connection.heartbeatTimeout) {
      clearTimeout(connection.heartbeatTimeout)
    }

    connection.heartbeatTimeout = setTimeout(() => {
      connection.instance?.close()
    }, 60000 + 1000)
  }

  const handleOpen = (event: WebSocketEventMap["open"]) => {
    connection.nReconnects = 0
    heartbeat()

    connection.listeners.forEach((listener) => {
      listener.options.current?.onOpen?.(event)
    })
  }

  const handleError = (event: WebSocketEventMap["error"]) => {
    connection.listeners.forEach((listener) => {
      listener.options.current?.onError?.(event)
    })
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

      connection.listeners.forEach((listener) => {
        listener.options.current?.onJsonMessage?.(parsedData)
      })
    } catch (error) {
      console.error(error)
    }
  }

  const handleClose = (event: WebSocketEventMap["close"]) => {
    if (connection.heartbeatTimeout) {
      clearTimeout(connection.heartbeatTimeout)
      connection.heartbeatTimeout = null
    }

    if (connection.reconnectTimeout) {
      clearTimeout(connection.reconnectTimeout)
      connection.reconnectTimeout = null
    }

    connection.instance?.removeEventListener("open", handleOpen)
    connection.instance?.removeEventListener("message", handleMessage)
    connection.instance?.removeEventListener("error", handleError)
    connection.instance?.removeEventListener("close", handleClose)

    const shouldReconnect = connection.listeners.some((listener) =>
      listener.options.current?.shouldReconnect?.({
        closedGracefully: connection.closedGracefully,
        nReconnects: connection.nReconnects
      })
    )

    connection.listeners.forEach((listener) => {
      listener.options.current?.onClose?.(event, {
        gracefully: connection.closedGracefully,
        reconnecting: shouldReconnect
      })
    })

    if (!connection.closedGracefully && shouldReconnect) {
      connection.reconnectTimeout = setTimeout(() => {
        onReconnect?.()
        connection.reconnectTimeout = null
      }, 2 ** connection.nReconnects * 1000)

      connection.nReconnects += 1
    } else {
      connection.nReconnects = 0
    }
  }

  connection.instance.addEventListener("open", handleOpen)
  connection.instance.addEventListener("error", handleError)
  connection.instance.addEventListener("close", handleClose)
  connection.instance.addEventListener("message", handleMessage)
}

export default attachListeners
