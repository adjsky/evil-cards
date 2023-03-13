import Controller from "../game/controller"
import SessionManager from "../game/session-manager"
import { SessionFactory } from "../game/session"

import type { FastifyPluginCallback } from "fastify"

const websocketRoutes: FastifyPluginCallback = (fastify, _, done) => {
  const sessionFactory = new SessionFactory()
  const sessionManager = new SessionManager(sessionFactory)
  const controller = new Controller(sessionManager)

  fastify.get("/ws", { websocket: true }, ({ socket }) => {
    controller.handleConnection(socket)
  })

  done()
}

export default websocketRoutes
