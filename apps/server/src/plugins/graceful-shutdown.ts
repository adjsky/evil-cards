import type { FastifyPluginCallback } from "fastify"

const signals = ["SIGTERM", "SIGINT"] as const
type Signal = typeof signals[number]

const gracefulShutdown: FastifyPluginCallback<{
  onSignal(signal: Signal): Promise<void>
}> = (fastify, { onSignal }, done) => {
  let shuttingDown = false

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
      fastify.log.error("faild to gracefully shutdown", error)
      process.exit(1)
    }
  }

  signals.forEach((signal) => {
    process.on(signal, () => handler(signal))
  })

  done()
}

export default gracefulShutdown
