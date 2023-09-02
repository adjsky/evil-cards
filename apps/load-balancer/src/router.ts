import { z } from "zod"

import { env } from "./env.ts"
import makeURLFromServer from "./make-url-from-server.ts"
import { updateRoundRobin } from "./round-robin.ts"

import type { FastifyPluginCallback } from "@evil-cards/core/fastify"
import type { SessionCache } from "@evil-cards/core/keydb"
import type Dockerode from "dockerode"
import type { SequentialRoundRobin } from "round-robin-js"
import type { ZodIssue } from "zod"

const getQuerySchema = z.object({
  sessionId: z.string().optional()
})

const postBodySchema = z.object({
  version: z.string()
})

const router: FastifyPluginCallback<{
  docker: Dockerode
  sessionCache: SessionCache
  roundRobin: SequentialRoundRobin<number>
}> = (fastify, { docker, sessionCache, roundRobin }, done) => {
  fastify.get("/", async (req, res) => {
    const query = getQuerySchema.safeParse(req.query)

    if (!query.success) {
      return res
        .status(400)
        .send({ message: formatIssues(query.error.issues, "query") })
    }

    const sessionId = query.data.sessionId

    if (sessionId) {
      const cachedSession = await sessionCache.get(sessionId)

      if (!cachedSession) {
        return res
          .status(404)
          .send({ message: "could not find session server" })
      }

      const server = cachedSession.server

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

  if (env.UPDATE_TOKEN) {
    fastify.post("/", async (req, res) => {
      if (!req.headers["authorization"]) {
        return res
          .status(401)
          .send({ message: "no authorization header found" })
      }

      const [authScheme, token] = req.headers["authorization"].split(" ")

      if (authScheme != "Bearer") {
        return res
          .status(401)
          .send({ message: "expected to receive bearer authorization" })
      }

      if (token != env.UPDATE_TOKEN) {
        return res.status(401).send({ message: "invalid token" })
      }

      const body = postBodySchema.safeParse(req.body)

      if (!body.success) {
        return res
          .status(400)
          .send({ message: formatIssues(body.error.issues, "body") })
      }

      await updateRoundRobin(docker, roundRobin, body.data.version)

      res.send({ message: "ok" })
    })
  }

  done()
}

const formatIssues = (issues: ZodIssue[], source: string) =>
  issues
    .map((issue) => {
      let prefix = source
      const path = issue.path.join("->")

      if (path != "") {
        prefix += `:${path}`
      }

      if (issue.code == "invalid_type") {
        return `[${prefix}] expected: ${issue.expected}, received: ${issue.received}`
      }

      return `[${prefix}] message: ${issue.message}`
    })
    .join(", ")

export default router
