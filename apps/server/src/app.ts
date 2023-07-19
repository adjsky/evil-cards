import websocketPlugin from "@fastify/websocket"

import { getServer } from "@evil-cards/core/fastify"
import { createClient } from "@evil-cards/core/keydb"

import { env } from "./env.ts"
import Controller from "./game/controller.ts"
import SessionManager from "./game/session-manager.ts"
import { SessionFactory } from "./game/session.ts"
import gameRoutes from "./routes/game.ts"

const fastify = await getServer({
  logger: {
    enabled: env.NODE_ENV != "test",
    pretty: env.NODE_ENV == "development",
    loki: env.LOKI_HOST
      ? {
          basicAuth:
            env.LOKI_USERNAME && env.LOKI_PASSWORD
              ? {
                  password: env.LOKI_PASSWORD,
                  username: env.LOKI_USERNAME
                }
              : undefined,
          host: env.LOKI_HOST,
          name: `server-${env.SERVER_NUMBER}`
        }
      : undefined
  },
  cors: {
    origin: env.CORS_ORIGIN
  },
  logMemory: env.LOG_MEMORY,
  async onShutdown() {
    await fastify.close()
    await subscriberCleanup()
    await controller.cleanSessionCache()
    await redisClient.disconnect()
  }
})

// REDIS
const redisClient = createClient(env.KEYDB_URL)
await redisClient.connect()

// GAME
const sessionFactory = new SessionFactory()
const sessionManager = new SessionManager(sessionFactory)
const controller = new Controller(sessionManager, redisClient, {
  serverNumber: env.SERVER_NUMBER
})

// REDIS SESSION SUBSCRIBER
const [subscribe, subscriberCleanup] =
  await controller.sessionCache.initializeSubscriber()

// FASTIFY PLUGINS
await fastify.register(websocketPlugin)

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
