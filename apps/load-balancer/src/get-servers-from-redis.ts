import makeURLFromServer from "./make-url-from-server"
import { env } from "./env"

import type { RedisClientWithLogs } from "@evil-cards/redis/client-with-logs"

async function getServersFromRedis(redis: RedisClientWithLogs) {
  const rawServers = await redis.get("servers")

  let parsedServers: number[] = []

  if (rawServers) {
    rawServers.split(" ").forEach((server) => {
      const parsedServer = Number(server)

      if (isNaN(parsedServer)) {
        return
      }

      parsedServers.push(parsedServer)
    })
  } else {
    parsedServers = Array.from({
      length: env.INITIAL_AVAILABLE_SERVERS
    }).map((_, index) => index + 1)
  }

  return parsedServers.map((parsedServer) => makeURLFromServer(parsedServer))
}

export default getServersFromRedis
