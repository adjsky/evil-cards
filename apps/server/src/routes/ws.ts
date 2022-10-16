import game from "../game/logic"
import type { FastifyPluginCallback } from "fastify"

const websocketRoutes: FastifyPluginCallback = (fastify, _, done) => {
  fastify.get("/", { websocket: true }, ({ socket }) => {
    game.controller.handleConnection(socket)
  })

  done()
}

export default websocketRoutes
