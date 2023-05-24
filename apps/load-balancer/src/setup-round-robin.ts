import { SequentialRoundRobin } from "round-robin-js"
import { RedisClientWithLogs } from "@evil-cards/redis/client-with-logs"
import getServersFromRedis from "./get-servers-from-redis.ts"

async function setupRoundRobin(
  redis: RedisClientWithLogs,
  subscriber: RedisClientWithLogs
) {
  const serversRoundRobin = new SequentialRoundRobin(
    await getServersFromRedis(redis)
  )

  await subscriber.pSubscribe("__keyspace@*__:servers", async () => {
    const servers = await getServersFromRedis(redis)

    serversRoundRobin.clear()
    servers.forEach((server) => serversRoundRobin.add(server))
  })

  return serversRoundRobin
}

export default setupRoundRobin
