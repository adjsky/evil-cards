import type Controller from "../game/controller.ts"
import type { AvailableSession } from "../ws/send.ts"
import type { FastifyPluginCallback } from "@evil-cards/core/fastify"
import type { Subscriber } from "@evil-cards/core/keydb"

const gameRoutes: FastifyPluginCallback<{
  controller: Controller
  subscribe: Subscriber[0]
}> = async (fastify, { controller, subscribe }, done) => {
  fastify.get("/session", { websocket: true }, ({ socket }) => {
    controller.handleConnection(socket)
  })

  fastify.get(
    "/available-sessions",
    { websocket: true },
    async ({ socket }) => {
      const sendSessions = (sessions: AvailableSession[]) => {
        socket.send(
          JSON.stringify(
            sessions
              .filter(
                (session) =>
                  session.public && !session.playing && session.players != 0
              )
              .sort((a, b) => {
                const playersCriteria = b.players - a.players
                const nicknameCriteria = a.hostNickname.localeCompare(
                  b.hostNickname
                )

                return playersCriteria || nicknameCriteria
              })
          )
        )
      }

      sendSessions(await controller.sessionCache.getAll())

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
