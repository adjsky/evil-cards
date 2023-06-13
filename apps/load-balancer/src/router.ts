import { z } from "zod"
import makeURLFromServer from "./make-url-from-server.ts"
import { createCtxFromReq } from "@evil-cards/ctx-log"

import type { FastifyPluginCallback } from "@evil-cards/fastify"
import type { SessionCache } from "@evil-cards/keydb"
import type { SequentialRoundRobin } from "round-robin-js"

const router: FastifyPluginCallback<{
  sessionCache: SessionCache
  roundRobin: SequentialRoundRobin<number>
}> = (fastify, { sessionCache, roundRobin }, done) => {
  const getQuerySchema = z.object({
    sessionId: z.string().optional()
  })

  fastify.get("/", async (req, res) => {
    const query = getQuerySchema.safeParse(req.query)

    if (!query.success) {
      return res.status(400).send({ message: "invalid query" })
    }

    const sessionId = query.data.sessionId
    const ctx = createCtxFromReq(req)

    if (sessionId) {
      const cachedSession = await sessionCache.get(ctx, sessionId)

      if (cachedSession.none) {
        return res
          .status(404)
          .send({ message: "could not find session server" })
      }

      const server = cachedSession.unwrap().server

      return res.send({ host: makeURLFromServer(server), message: "ok" })
    }

    if (roundRobin.count() == 0) {
      return res
        .status(500)
        .send({ message: "could not find any available server" })
    }

    const server = roundRobin.next()

    res.send({ host: makeURLFromServer(server.value), message: "ok" })
  })

  done()
}

export default router
