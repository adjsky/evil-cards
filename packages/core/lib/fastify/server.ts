import fastifyCompress from "@fastify/compress"
import fastifyCors from "@fastify/cors"
import fastifyRequestContext from "@fastify/request-context"
import Fastify from "fastify"
import fastifyHealthcheck from "fastify-healthcheck"
import fastifyMetrics from "fastify-metrics"

import gracefulShutdown from "./plugins/graceful-shutdown.ts"
import memoryLogPlugin from "./plugins/log-memory.ts"

import type { GracefulShutdownOptions } from "./plugins/graceful-shutdown.ts"
import type { FastifyInstance, FastifyServerOptions } from "fastify"

type Options = {
  logger?: LoggerOptions
  cors?: {
    origin: string
  }
  logMemory?: boolean
  onShutdown?: GracefulShutdownOptions["onShutdown"]
}

let fastify: FastifyInstance | null = null

export async function getServer(options: Options) {
  if (fastify) {
    throw new Error(
      "Could not instantiate fastify server. Instance already exists."
    )
  }

  fastify = Fastify({
    logger: options.logger ? getLogger(options.logger) : false
  })

  await fastify.register(fastifyCompress)

  if (options.cors) {
    await fastify.register(fastifyCors, {
      origin: options.cors.origin
    })
  }

  // third party plugins
  await fastify.register(fastifyMetrics)
  await fastify.register(fastifyHealthcheck, { logLevel: "silent" })
  await fastify.register(fastifyRequestContext, {
    defaultStoreValues: (req) => ({
      meta: {
        reqId: req.id,
        ip: req.ip
      },
      debugLogs: []
    })
  })

  // internal plugins
  await fastify.register(memoryLogPlugin, { enabled: options.logMemory })
  await fastify.register(gracefulShutdown, { onShutdown: options.onShutdown })

  return fastify
}

export function getFastifyInstance() {
  return fastify
}

export type LoggerOptions = {
  loki?: {
    name: string
    host: string
    basicAuth?: {
      username: string
      password: string
    }
  }
  pretty?: boolean
  enabled?: boolean
}

function getLogger(options: LoggerOptions): FastifyServerOptions["logger"] {
  if (!options.enabled) {
    return false
  }

  if (options.pretty) {
    return {
      level: "debug",
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname"
        }
      }
    }
  }

  if (options.loki) {
    return {
      level: "info",
      transport: {
        target: "pino-loki",
        options: {
          batching: true,
          interval: 5,

          labels: { app: options.loki.name },

          host: options.loki.host,
          basicAuth: options.loki.basicAuth
        }
      }
    }
  }

  return true
}
