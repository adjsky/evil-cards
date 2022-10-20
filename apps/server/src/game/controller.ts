import { serializeError } from "serialize-error"
import Emittery from "emittery"

import { messageSchema } from "@kado/schemas/dist/server/receive"
import stringify from "../ws/stringify"

import type { WebSocket } from "ws"
import type { Emitter } from "./types"

class Controller {
  public emitter: Emitter

  constructor() {
    this.emitter = new Emittery()
  }

  handleConnection(socket: WebSocket) {
    socket.alive = true
    const interval = setInterval(() => {
      if (!socket.alive) {
        socket.close()
        this.emitter.emit("closed", { socket })
        clearInterval(interval)
        return
      }

      socket.alive = false
      socket.send(stringify({ type: "ping" }))
    }, 3000)

    socket.on("message", async (rawData) => {
      try {
        const message = messageSchema.parse(JSON.parse(rawData.toString()))

        if (message.type == "pong") {
          socket.alive = true
        } else {
          await this.emitter.emit(
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
