import type { FastifyBaseLogger, FastifyPluginCallback } from "fastify"

function getMemoryLogger(logger: FastifyBaseLogger) {
  return () => {
    const formatMemoryUsage = (data: number) =>
      `${Math.round((data / 1024 / 1024) * 100) / 100} MB`

    const memoryData = process.memoryUsage()

    const memoryUsage = {
      msg: "Memory stats",
      rss: `${formatMemoryUsage(
        memoryData.rss
      )} => Resident Set Size - total memory allocated for the process execution`,
      heapTotal: `${formatMemoryUsage(
        memoryData.heapTotal
      )} => total size of the allocated heap`,
      heapUsed: `${formatMemoryUsage(
        memoryData.heapUsed
      )} => actual memory used during the execution`,
      external: `${formatMemoryUsage(memoryData.external)} => external memory`
    }

    logger.info(memoryUsage)
  }
}

const memoryLogPlugin: FastifyPluginCallback<{
  intervalInSeconds?: number
  enabled?: boolean
}> = (fastify, { intervalInSeconds = 15, enabled }, done) => {
  const logMemory = getMemoryLogger(fastify.log)

  if (enabled) {
    logMemory()
    setInterval(logMemory, intervalInSeconds * 1000)
  }

  done()
}

export default memoryLogPlugin
