import fp from "fastify-plugin"

import type { FastifyPluginCallback } from "fastify"

declare module "fastify" {
  export interface FastifyInstance {
    isShuttingDown(): boolean
  }
}

const signals = ["SIGTERM", "SIGINT"] as const
type Signal = typeof signals[number]

let shuttingDown = false

export type GracefulShutdownOptions = {
  onShutdown: (signal?: Signal) => Promise<void>
}

const gracefulShutdown: FastifyPluginCallback<GracefulShutdownOptions> = (
  fastify,
  { onShutdown },
  done
) => {
  fastify.decorate("isShuttingDown", isShuttingDown)

  const handler = async (signal?: Signal) => {
    if (shuttingDown) {
      return
    }

    shuttingDown = true

    fastify.log.info(
      signal
        ? `Received ${signal}, starting graceful shutdown`
        : "Received uncaught exception/rejection, , starting graceful shutdown"
    )

    try {
      await onShutdown(signal)

      process.exit(0)
    } catch (error) {
      fastify.log.error(error, "Failed to shutdown gracefully")
      process.exit(1)
    }
  }

  signals.forEach((signal) => {
    process.on(signal, () => handler(signal))
  })
  process.on("uncaughtException", handler)
  process.on("unhandledRejection", handler)

  done()
}

export function isShuttingDown() {
  return shuttingDown
}

export default fp(gracefulShutdown)
