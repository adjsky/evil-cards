import gameController from "../game/controller"
import type { FastifyPluginCallback } from "fastify"

const websocketRoutes: FastifyPluginCallback = (fastify, _, done) => {
  fastify.get("/", { websocket: true }, ({ socket }) => {
    gameController.handleConnection(socket)
  })

  done()
}

export default websocketRoutes
