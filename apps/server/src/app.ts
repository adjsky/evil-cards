import Fastify from "fastify"
import fastifyCompress from "@fastify/compress"
import fastifyCors from "@fastify/cors"
import websocketPlugin from "@fastify/websocket"
import { createClient } from "@evil-cards/keydb"

import memoryLogPlugin from "./plugins/log-memory.ts"
import gracefulShutdown from "./plugins/graceful-shutdown.ts"
import Controller from "./game/controller.ts"
import SessionManager from "./game/session-manager.ts"
import { SessionFactory } from "./game/session.ts"
import gameRoutes from "./routes/game.ts"
import { env } from "./env.ts"

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

// REDIS
const redisClient = createClient(env.KEYDB_URL, fastify.log)
await redisClient.connect()

// GAME
const sessionFactory = new SessionFactory()
const sessionManager = new SessionManager(sessionFactory)
const controller = new Controller(
  sessionManager,
  redisClient,
  {
    serverNumber: env.SERVER_NUMBER
  },
  fastify.log
)

// REDIS SESSION SUBSCRIBER
const subscriber = await controller.sessionCache.initializeSubscriber()
if (subscriber.none) {
  throw new Error("Could not initialize sessionCache subscriber")
}
const [subscribe, subscriberCleanup] = subscriber.unwrap()

// FASTIFY PLUGINS
await fastify.register(fastifyCompress)
await fastify.register(fastifyCors, {
  origin: env.CORS_ORIGIN
})
await fastify.register(websocketPlugin)

// INTERNAL PLUGINS
await fastify.register(gracefulShutdown, {
  async onSignal() {
    await controller.cleanSessionCache()
    await Promise.all([redisClient.disconnect(), subscriberCleanup()])
  }
})
await fastify.register(memoryLogPlugin, { enabled: env.LOG_MEMORY })

// ROUTES
await fastify.register(gameRoutes, {
  controller,
  subscribe,
  prefix: "/ws"
})

await fastify.listen({
  port: env.PORT,
  host: "0.0.0.0"
})
