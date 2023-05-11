import { logWithCtx } from "./context.ts"

import type { FastifyBaseLogger } from "fastify"
import type { RedisClientType } from "redis"
import type { ReqContext } from "./context.ts"

export type RedisClientWithLogs = {
  [Command in CommandToLog]: (
    ctx: ReqContext,
    ...args: Parameters<RedisClientType[Command]>
  ) => ReturnType<RedisClientType[Command]>
}

const commandsToLog = ["set", "del"] as const
type CommandToLog = typeof commandsToLog[number]

export function getRedisClientWithLogs(
  redisClient: RedisClientType,
  baseLog: FastifyBaseLogger
) {
  const log = baseLog.child({ component: "redis" })

  const redisClientWithLogs: Record<string, unknown> = {}

  for (const command of commandsToLog) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redisClientWithLogs[command] = async (ctx: ReqContext, ...args: any[]) => {
      try {
        const result = await redisClient[command](...args)

        logWithCtx(ctx, log).info(
          {
            command,
            args,
            result
          },
          "finished redis command"
        )

        return result
      } catch (error) {
        logWithCtx(ctx, log).error(
          {
            err: error,
            command,
            args
          },
          "received a redis error"
        )

        throw error
      }
    }
  }

  return redisClientWithLogs as RedisClientWithLogs
}
