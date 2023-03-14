import Fastify from "fastify"
import fastifyCompress from "@fastify/compress"
import fastifyCors from "@fastify/cors"
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

await fastify.register(fastifyCompress)
await fastify.register(fastifyCors, {
  origin: `${env.SITE_PROTOCOL}://${env.SITE_DOMAIN}`
})

const redis = createClient({ url: env.REDIS_URL })
const subscriber = redis.duplicate()

await Promise.all([redis.connect(), subscriber.connect()])

async function getServerNumbersFromRedis() {
  const rawServers = await redis.get("servers")

  let parsedServerNumbers = ["1", "2"]

  if (rawServers) {
    parsedServerNumbers = rawServers.split(" ")
  }

  return parsedServerNumbers.map((parsedServerNumber) =>
    makeURLFromServer(parsedServerNumber)
  )
}

function makeURLFromServer(serverNumber: string) {
  return `${env.WS_PROTOCOL}://sv-${serverNumber}.${env.SITE_DOMAIN}`
}

const serversRoundRobin = new SequentialRoundRobin(
  await getServerNumbersFromRedis()
)

await subscriber.pSubscribe("__keyspace@*__:servers", async () => {
  const servers = await getServerNumbersFromRedis()

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

    return res.send({ host: makeURLFromServer(sessionServer), message: "ok" })
  }

  const server = serversRoundRobin.next()

  res.send({ host: server.value, message: "ok" })
})

await fastify.listen({
  port: env.PORT,
  host: "0.0.0.0"
})
