import Fastify from "fastify"
import { createClient } from "redis"
import { SequentialRoundRobin } from "round-robin-js"
import { env } from "./env"
import { z } from "zod"

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

const fastify = Fastify({
  logger: envLogger[env.NODE_ENV]
})

const redis = createClient({ url: env.REDIS_URL })
await redis.connect()

const serversSchema = z.array(z.string())

async function getServersFromRedis() {
  const rawServers = await redis.get("servers")

  if (!rawServers) {
    throw new Error("received empty servers from redis")
  }

  return serversSchema.parse(rawServers)
}

const serversRoundRobin = new SequentialRoundRobin(await getServersFromRedis())

await redis.pSubscribe("__keyspace@*__:servers", async () => {
  const servers = await getServersFromRedis()

  serversRoundRobin.clear()
  servers.forEach((server) => serversRoundRobin.add(server))
})

const getQuerySchema = z.object({
  sessionId: z.string().optional()
})

fastify.get("/", async (req, res) => {
  const query = getQuerySchema.safeParse(req.query)

  if (!query.success) {
    return res.status(400).send({ message: "invalid query" })
  }

  const sessionId = query.data.sessionId

  if (sessionId) {
    const sessionServer = await redis.get(`sessionserver:${sessionId}`)

    if (!sessionServer) {
      return res.status(404).send({ message: "could not find session server" })
    }

    return res.send({ host: sessionServer, message: "ok" })
  }

  const server = serversRoundRobin.next()

  res.send({ host: server.value, message: "ok" })
})

await fastify.listen({
  port: env.PORT,
  host: "0.0.0.0"
})
