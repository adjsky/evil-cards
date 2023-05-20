import Controller from "../game/controller.ts"
import SessionManager from "../game/session-manager.ts"
import { SessionFactory } from "../game/session.ts"
import { env } from "../env.ts"
import { createCtxFromReq } from "@evil-cards/ctx-log"

import type { FastifyPluginCallback } from "fastify"
import type { RedisClientWithLogs } from "@evil-cards/redis/client-with-logs"
import type { CachedSession } from "../lib/ws/send.ts"

const gameRoutes: FastifyPluginCallback<{
  redisClient: RedisClientWithLogs
}> = async (fastify, { redisClient }, done) => {
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

  const subscriber = await controller.sessionCache.initializeSubscriber()

  subscriber.match({
    none() {
      throw new Error("Could not initialize sessionCache subscriber")
    },
    some([subscribe]) {
      fastify.get("/session", { websocket: true }, ({ socket }, req) => {
        const ctx = createCtxFromReq(req)

        controller.handleConnection(ctx, socket)
      })

      fastify.get(
        "/available-sessions",
        { websocket: true },
        async ({ socket }, req) => {
          const ctx = createCtxFromReq(req)

          const sessions = await controller.sessionCache.getAll(ctx)
          if (sessions.some) {
            socket.send(JSON.stringify(sessions.unwrap()))
          }

          const listener = (sessions: CachedSession[]) => {
            socket.send(JSON.stringify(sessions))
          }

          const cleanup = subscribe(listener)

          socket.on("close", cleanup)
        }
      )
    }
  })

  done()
}

export default gameRoutes
