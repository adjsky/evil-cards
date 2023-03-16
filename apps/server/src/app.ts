import Fastify from "fastify"
import fastifyCompress from "@fastify/compress"
import fastifyCors from "@fastify/cors"

import websocketPlugin from "@fastify/websocket"
import memoryLogPlugin from "./plugins/log-memory"
import { buildRedisClient } from "./build"

import websocketRoutes from "./routes/ws"
import { env } from "./env"
import { getRedisClientWithLogs } from "./redis-client-with-logs"

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
await redisClient.connect()

const redisClientWithLogs = getRedisClientWithLogs(redisClient, fastify.log)

await fastify.register(fastifyCompress)
await fastify.register(fastifyCors, {
  origin: env.SITE_URL
})

await fastify.register(memoryLogPlugin, { enabled: env.LOG_MEMORY })
await fastify.register(websocketPlugin)
await fastify.register(websocketRoutes, { redisClient: redisClientWithLogs })

await fastify.listen({
  port: env.PORT,
  host: "0.0.0.0"
})
