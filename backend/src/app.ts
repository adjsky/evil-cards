import Fastify from "fastify"
import websocketPlugin from "@fastify/websocket"

import websocketRoutes from "./routes/ws"

const fastify = Fastify({ logger: true })

// plugins
await fastify.register(websocketPlugin)

// routes
await fastify.register(websocketRoutes)

await fastify.listen({ port: 3000 })
