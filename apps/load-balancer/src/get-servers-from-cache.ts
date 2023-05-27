import makeURLFromServer from "./make-url-from-server.ts"
import { env } from "./env.ts"

import type { Client } from "@evil-cards/keydb"

async function getServersFromCache(client: Client) {
  const rawServers = await client.get("servers")

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

export default getServersFromCache
