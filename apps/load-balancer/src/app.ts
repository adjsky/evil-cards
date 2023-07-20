import Docker from "dockerode"

import { getServer } from "@evil-cards/core/fastify"
import { createClient, SessionCache } from "@evil-cards/core/keydb"

import { env } from "./env.ts"
import router from "./router.ts"
import setupRoundRobin from "./setup-round-robin.ts"

const docker = new Docker({ socketPath: "/var/run/docker.sock" })

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

const redis = createClient(env.KEYDB_URL)
await redis.connect()
const sessionCache = new SessionCache(redis)

const { roundRobin } = await setupRoundRobin(docker)

await fastify.register(router, {
  sessionCache,
  roundRobin
})

await fastify.listen({
  port: env.PORT,
  host: "0.0.0.0"
})
