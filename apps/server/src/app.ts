import Fastify from "fastify"

import websocketPlugin from "@fastify/websocket"
import memoryLogPlugin from "./plugins/log-memory"

import websocketRoutes from "./routes/ws"
import { env } from "./env"

const fastify = Fastify({ logger: true })

await fastify.register(memoryLogPlugin, { enabled: env.LOG_MEMORY })
await fastify.register(websocketPlugin)
await fastify.register(websocketRoutes)

await fastify.listen({
  port: env.PORT,
  host: "0.0.0.0"
})
