import Fastify from "fastify"
import fastifyCompress from "@fastify/compress"
import fastifyCors from "@fastify/cors"

import websocketPlugin from "@fastify/websocket"
import memoryLogPlugin from "./plugins/log-memory.ts"
import { buildRedisClient } from "./build.ts"

import gameRoutes from "./routes/game.ts"
import { env } from "./env.ts"
import { getClientWithLogs } from "@evil-cards/redis/client-with-logs"

const envLogger = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname"
      }
    }
  },
  production: true,
  test: false
}

const fastify = Fastify({ logger: envLogger[env.NODE_ENV] })

const redisClient = buildRedisClient()
const redisClientWithLogs = getClientWithLogs(redisClient, fastify.log)
await redisClientWithLogs.connect()

await fastify.register(fastifyCompress)
await fastify.register(fastifyCors, {
  origin: env.CORS_ORIGIN
})

await fastify.register(memoryLogPlugin, { enabled: env.LOG_MEMORY })
await fastify.register(websocketPlugin)
await fastify.register(gameRoutes, {
  redisClient: redisClientWithLogs,
  prefix: "/ws"
})

await fastify.listen({
  port: env.PORT,
  host: "0.0.0.0"
})
