import makeURLFromServer from "./make-url-from-server.ts"
import { env } from "./env.ts"
import { z } from "zod"

import type { Client } from "@evil-cards/keydb"

const serversSchema = z.array(z.coerce.number())

async function getServersFromCache(client: Client) {
  const rawServers = await client.get("servers")

  let parsedServers: number[] = []

  if (rawServers) {
    const result = serversSchema.safeParse(rawServers.split(" "))

    if (result.success) {
      parsedServers = result.data
    }
  } else {
    parsedServers = Array.from({
      length: env.INITIAL_AVAILABLE_SERVERS
    }).map((_, index) => index + 1)
  }

  return parsedServers.map((parsedServer) => makeURLFromServer(parsedServer))
}

export default getServersFromCache
