import Fastify from "fastify"

import websocketPlugin from "@fastify/websocket"
import memoryLogPlugin from "./plugins/log-memory"

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

await fastify.register(memoryLogPlugin, { enabled: env.LOG_MEMORY })
await fastify.register(websocketPlugin)
await fastify.register(websocketRoutes)

await fastify.listen({
  port: env.PORT,
  host: "0.0.0.0"
})
