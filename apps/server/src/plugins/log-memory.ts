import type { FastifyPluginCallback } from "fastify"

function logMemory() {
  const formatMemoryUsage = (data: number) =>
    `${Math.round((data / 1024 / 1024) * 100) / 100} MB`

  const memoryData = process.memoryUsage()

  const memoryUsage = {
    rss: `${formatMemoryUsage(
      memoryData.rss
    )} -> Resident Set Size - total memory allocated for the process execution`,
    heapTotal: `${formatMemoryUsage(
      memoryData.heapTotal
    )} -> total size of the allocated heap`,
    heapUsed: `${formatMemoryUsage(
      memoryData.heapUsed
    )} -> actual memory used during the execution`,
    external: `${formatMemoryUsage(memoryData.external)} -> V8 external memory`
  }

  console.log(memoryUsage)
}

const memoryLogPlugin: FastifyPluginCallback<{
  intervalInSeconds?: number
  enabled?: boolean
}> = (_, { intervalInSeconds = 10, enabled }, done) => {
  if (enabled) {
    setInterval(logMemory, intervalInSeconds * 1000)
  }

  done()
}

export default memoryLogPlugin
