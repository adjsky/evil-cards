import Fastify from "fastify"
import websocketPlugin from "@fastify/websocket"

const fastify = Fastify({ logger: true })
await fastify.register(websocketPlugin)

fastify.get("/", { websocket: true }, (connection) => {
  connection.socket.on("message", () => {
    connection.socket.send("hi from server")
  })
})

await fastify.listen({ port: 3000 })
