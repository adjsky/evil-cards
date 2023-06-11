import type { FastifyPluginCallback } from "@evil-cards/fastify"

const signals = ["SIGTERM", "SIGINT"] as const
type Signal = typeof signals[number]

let shuttingDown = false

const gracefulShutdown: FastifyPluginCallback<{
  onSignal(signal: Signal): Promise<void>
}> = (fastify, { onSignal }, done) => {
  const handler = async (signal: Signal) => {
    if (shuttingDown) {
      return
    }

    shuttingDown = true

    fastify.log.info(`received ${signal}, starting graceful shutdown`)

    try {
      await fastify.close()
      await onSignal(signal)

      process.exit(0)
    } catch (error) {
      fastify.log.error("failed graceful shutdown", error)
      process.exit(1)
    }
  }

  signals.forEach((signal) => {
    process.on(signal, () => handler(signal))
  })

  done()
}

export function isShuttingDown() {
  return shuttingDown
}

export default gracefulShutdown
