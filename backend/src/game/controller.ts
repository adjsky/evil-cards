import { serializeError } from "serialize-error"
import Emittery from "emittery"

import { messageSchema } from "../schemas"
import stringify from "../functions/stringify"

import type { WebSocket } from "ws"
import type { Emitter } from "./types"

class Controller {
  public emitter: Emitter

  constructor() {
    this.emitter = new Emittery()
  }

  handleConnection(socket: WebSocket) {
    socket.on("message", (rawData) => {
      try {
        const message = messageSchema.parse(JSON.parse(rawData.toString()))

        this.emitter.emit(
          message.type,
          "details" in message ? { ...message.details, socket } : { socket }
        )
      } catch (error) {
        console.error(error)
        socket.send(
          stringify({
            type: "error",
            data: serializeError(error).message
          })
        )
      }
    })
  }
}

const gameController = new Controller()

export default gameController
