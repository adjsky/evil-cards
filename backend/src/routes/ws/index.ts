import { match } from "ts-pattern"

import { messageSchema } from "../../schemas"
import { SessionsManager } from "../../sessions"

import type { FastifyPluginCallback } from "fastify"
import type { WebSocket } from "ws"
import type { CreateRoomDetails, ConnectDetails } from "../../schemas"

const sessionsManager = new SessionsManager()

class WebsocketHandler {
  private socket: WebSocket

  constructor(socket: WebSocket) {
    this.socket = socket
  }

  createRoom(details: CreateRoomDetails) {
    const sessionManager = sessionsManager.createSession(details, this.socket)
    this.socket.send(sessionManager.toString())
  }

  connect(details: ConnectDetails) {
    // todo
  }
}

const websocketRoutes: FastifyPluginCallback = (fastify, _, done) => {
  fastify.get("/", { websocket: true }, ({ socket }) => {
    socket.on("message", (rawData) => {
      try {
        const message = messageSchema.parse(JSON.parse(rawData.toString()))
        const handler = new WebsocketHandler(socket)

        match(message)
          .with({ type: "create-room" }, ({ details }) =>
            handler.createRoom(details)
          )
          .with({ type: "connect" }, ({ details }) => handler.connect(details))
          .exhaustive()
      } catch (error) {
        console.error(error)
        socket.send(
          JSON.stringify({
            type: "error",
            data: error
          })
        )
      }
    })
  })

  done()
}

export default websocketRoutes
