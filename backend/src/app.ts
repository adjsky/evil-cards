import Fastify from "fastify"
import websocketPlugin from "@fastify/websocket"
import websocketRoutes from "./routes/ws"
import { env } from "./env"

const fastify = Fastify({ logger: true })

await fastify.register(websocketPlugin)
await fastify.register(websocketRoutes)

await fastify.listen({
  port: env.PORT
})
