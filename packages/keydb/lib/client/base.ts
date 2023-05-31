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

  return getClientWithLogs(client, baseLog.child({ component: "redis" }))
}

function getClientWithLogs(client: RedisClientType, log: Logger): Client {
  const handler = getHandler(log)
  const multiProxyFactory = getMultiProxyFactory(log)

  const proxy = new Proxy(client, {
    get(target, command, receiver) {
      if (command == "withContext") {
        return (ctx: ReqContext) =>
          getClientWithLogs(client, logWithCtx(ctx, log))
      }

      if (command == "duplicate") {
        return (...args: Parameters<RedisClientType["duplicate"]>) => {
          const duplicatedClient = target.duplicate(...args)

          return getClientWithLogs(duplicatedClient, log)
        }
      }

      if (command == "multi") {
        return () => {
          const multiClient = target.multi()

          return multiProxyFactory(multiClient)
        }
      }

      return handler(target, command, receiver)
    }
  })

  return proxy as unknown as Client
}
