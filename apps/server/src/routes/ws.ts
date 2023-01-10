import game from "../game"
import type { FastifyPluginCallback } from "fastify"

const websocketRoutes: FastifyPluginCallback = (fastify, _, done) => {
  fastify.get("/ws", { websocket: true }, ({ socket }) => {
    game.controller.handleConnection(socket)
  })

  done()
}

export default websocketRoutes
