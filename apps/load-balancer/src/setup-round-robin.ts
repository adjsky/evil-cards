import getServersFromCache from "./get-servers-from-cache"
import { SequentialRoundRobin } from "round-robin-js"
import type { Client } from "@evil-cards/keydb"

async function setupRoundRobin(redis: Client, subscriber: Client) {
  const serversRoundRobin = new SequentialRoundRobin(
    await getServersFromCache(redis)
  )

  await subscriber.pSubscribe("__keyspace@*__:servers", async () => {
    const servers = await getServersFromCache(redis)

    serversRoundRobin.clear()
    servers.forEach((server) => serversRoundRobin.add(server))
  })

  return serversRoundRobin
}

export default setupRoundRobin
