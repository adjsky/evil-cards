import Controller from "../game/controller"
import SessionManager from "../game/session-manager"
import { SessionFactory } from "../game/session"
import { env } from "../env"
import { createCtxFromReq } from "../context"

import type { FastifyPluginCallback } from "fastify"
import type { RedisClientType } from "redis"

const websocketRoutes: FastifyPluginCallback<{ redis: RedisClientType }> = (
  fastify,
  { redis },
  done
) => {
  const sessionFactory = new SessionFactory()
  const sessionManager = new SessionManager(sessionFactory)
  const controller = new Controller(
    sessionManager,
    redis,
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
