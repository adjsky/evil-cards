import Fastify from "fastify"
import websocketPlugin from "@fastify/websocket"
import { nanoid } from "nanoid"
import z from "zod"
import { match } from "ts-pattern"

const fastify = Fastify({ logger: true })
await fastify.register(websocketPlugin)

const sessions = new Map<string, any>()

const MessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("create-room"),
    data: z.object({ name: z.string() })
  }),
  z.object({
    type: z.literal("connect"),
    data: z.object({ name: z.string() })
  })
])

fastify.get("/", { websocket: true }, ({ socket }) => {
  socket.on("message", (rawData) => {
    try {
      const message = MessageSchema.parse(JSON.parse(rawData.toString()))

      match(message)
        .with({ type: "create-room" }, ({ data }) => {
          const roomId = nanoid(5)
          sessions.set(roomId, { users: [data.name] })

          console.log(sessions)
        })
        .with({ type: "connect" }, () => {
          //
        })
        .exhaustive()
    } catch (error) {
      socket.send(
        JSON.stringify({
          type: "error",
          data: error
        })
      )
    }
  })
})

await fastify.listen({ port: 3000 })
