import { createCtxFromReq } from "@evil-cards/ctx-log"

import type { FastifyPluginCallback } from "fastify"
import type { AvailableSession } from "../lib/ws/send.ts"
import type Controller from "../game/controller.ts"
import type { Subscribe } from "@evil-cards/keydb"

const gameRoutes: FastifyPluginCallback<{
  controller: Controller
  subscribe: Subscribe
}> = async (fastify, { controller, subscribe }, done) => {
  fastify.get("/session", { websocket: true }, ({ socket }, req) => {
    const ctx = createCtxFromReq(req)

    controller.handleConnection(ctx, socket)
  })

  fastify.get(
    "/available-sessions",
    { websocket: true },
    async ({ socket }, req) => {
      const sendSessions = (sessions: AvailableSession[]) => {
        socket.send(
          JSON.stringify(
            sessions
              .filter((session) => session.public)
              .sort((a, b) => b.players - a.players)
          )
        )
      }

      const ctx = createCtxFromReq(req)

      const sessions = await controller.sessionCache.getAll(ctx)
      if (sessions.some) {
        sendSessions(sessions.unwrap())
      }

      const listener = (sessions: AvailableSession[]) => {
        sendSessions(sessions)
      }

      const cleanup = subscribe(listener)

      socket.on("close", cleanup)
    }
  )

  done()
}

export default gameRoutes
