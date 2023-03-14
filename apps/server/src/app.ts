import Fastify from "fastify"
import fastifyCompress from "@fastify/compress"
import fastifyCors from "@fastify/cors"

import websocketPlugin from "@fastify/websocket"
import memoryLogPlugin from "./plugins/log-memory"
import { buildRedisClient } from "./build"

import websocketRoutes from "./routes/ws"
import { env } from "./env"

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

const redis = buildRedisClient()
await redis.connect()

await fastify.register(fastifyCompress)
await fastify.register(fastifyCors, {
  origin: env.SITE_PATH
})

await fastify.register(memoryLogPlugin, { enabled: env.LOG_MEMORY })
await fastify.register(websocketPlugin)
await fastify.register(websocketRoutes, { redis })

await fastify.listen({
  port: env.PORT,
  host: "0.0.0.0"
})
