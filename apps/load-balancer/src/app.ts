import { z } from "zod"
import Docker from "dockerode"
import { createCtxFromReq } from "@evil-cards/ctx-log"
import { SessionCache, createClient } from "@evil-cards/keydb"
import { getServer } from "@evil-cards/fastify"

import makeURLFromServer from "./make-url-from-server.ts"
import setupRoundRobin from "./setup-round-robin.ts"
import { env } from "./env.ts"

const docker = new Docker({ socketPath: "/var/run/docker.sock" })

const containers = await docker.listContainers()
console.log(containers)

const fastify = await getServer({
  logger: {
    enabled: env.NODE_ENV != "test",
    pretty: env.NODE_ENV == "development",
    loki: env.LOKI_HOST
      ? {
          basicAuth:
            env.LOKI_USERNAME && env.LOKI_PASSWORD
              ? {
                  password: env.LOKI_PASSWORD,
                  username: env.LOKI_USERNAME
                }
              : undefined,
          host: env.LOKI_HOST,
          name: "load-balancer"
        }
      : undefined
  },
  cors: {
    origin: env.CORS_ORIGIN
  }
})

const redis = createClient(env.KEYDB_URL, fastify.log)
const subscriber = redis.duplicate()
await Promise.all([redis.connect(), subscriber.connect()])

const sessionCache = new SessionCache(redis)

const roundRobin = await setupRoundRobin(redis, subscriber)

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
      return res.status(404).send({ message: "could not find session server" })
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

  res.send({ host: server.value, message: "ok" })
})

await fastify.listen({
  port: env.PORT,
  host: "0.0.0.0"
})
