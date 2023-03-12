import { serializeError } from "serialize-error"
import Emittery from "emittery"

import { messageSchema } from "../lib/ws/receive"
import stringify from "../lib/ws/stringify"
import { ALIVE_CHECK_INTERVAL_MS } from "./constants"

import type { WebSocket } from "ws"
import type { ControllerEvents } from "./types"

class Controller {
  public eventBus: ControllerEvents

  constructor() {
    this.eventBus = new Emittery()
  }

  handleConnection(socket: WebSocket) {
    socket.alive = true
    const interval = setInterval(() => {
      if (!socket.alive) {
        this.eventBus.emit("lostconnection", { socket })
        socket.terminate()
        clearInterval(interval)
        return
      }

      socket.alive = false
      socket.send(stringify({ type: "ping" }))
    }, ALIVE_CHECK_INTERVAL_MS)

    socket.on("message", async (rawData) => {
      try {
        const message = messageSchema.parse(JSON.parse(rawData.toString()))

        if (message.type == "pong") {
          socket.alive = true
        } else {
          await this.eventBus.emit(
            message.type,
            "details" in message ? { ...message.details, socket } : { socket }
          )
        }
      } catch (error) {
        console.error(error)
        socket.send(
          stringify({
            type: "error",
            details: serializeError(error).message
          })
        )
      }
    })
  }
}

export default Controller
