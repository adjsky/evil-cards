import Controller from "../game/controller"
import SessionManager from "../game/session-manager"
import { SessionFactory } from "../game/session"
import { env } from "../env"
import { createCtxFromReq } from "../context"

import type { FastifyPluginCallback } from "fastify"
import type { RedisClientWithLogs } from "../redis-client-with-logs"

const websocketRoutes: FastifyPluginCallback<{
  redisClient: RedisClientWithLogs
}> = (fastify, { redisClient }, done) => {
  const sessionFactory = new SessionFactory()
  const sessionManager = new SessionManager(sessionFactory)
  const controller = new Controller(
    sessionManager,
    redisClient,
    {
      serverNumber: env.SERVER_NUMBER
    },
    fastify.log
  )

  fastify.get("/ws", { websocket: true }, ({ socket }, req) => {
    const ctx = createCtxFromReq(req)

    controller.handleConnection(ctx, socket)
  })

  done()
}

export default websocketRoutes
