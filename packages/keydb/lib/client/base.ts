import redis from "redis"
import { logWithCtx } from "@evil-cards/ctx-log"
import { getHandler } from "./handler.ts"
import { getMultiProxyFactory } from "./multi.ts"

import type { RedisClientType } from "redis"
import type { Logger, ReqContext } from "@evil-cards/ctx-log"

export type Client = Omit<RedisClientType, "duplicate"> & {
  withContext(ctx: ReqContext): Client
  duplicate(...args: Parameters<RedisClientType["duplicate"]>): Client
}

export function createClient(url: string, baseLog: Logger) {
  const client: RedisClientType = redis.createClient({ url })

  return getClientWithLogs(client, baseLog)
}

function getClientWithLogs(client: RedisClientType, baseLog: Logger): Client {
  const log = baseLog.child({ component: "redis" })
  const handler = getHandler(log)

  const originalDuplicate = client.duplicate.bind(client)
  const originalMulti = client.multi.bind(client)

  const multiProxyFactory = getMultiProxyFactory(baseLog)

  const proxy = new Proxy(client, {
    get(target, command, receiver) {
      return handler(target, command, receiver)
    }
  })

  return Object.assign(proxy, {
    withContext(ctx: ReqContext) {
      return getClientWithLogs(
        Object.assign(client, {
          duplicate: originalDuplicate,
          multi: originalMulti
        }),
        logWithCtx(ctx, log)
      )
    },
    duplicate(...args: Parameters<RedisClientType["duplicate"]>) {
      const duplicatedClient = originalDuplicate(...args)

      return getClientWithLogs(duplicatedClient, baseLog)
    },
    multi() {
      const multiClient = originalMulti()

      return multiProxyFactory(multiClient)
    }
  })
}
