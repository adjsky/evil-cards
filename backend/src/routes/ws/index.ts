import Game from "../../game"
import type { FastifyPluginCallback } from "fastify"

const game = new Game()

const websocketRoutes: FastifyPluginCallback = (fastify, _, done) => {
  fastify.get("/", { websocket: true }, ({ socket }) => {
    game.handleConnection(socket)
  })

  done()
}

export default websocketRoutes
