import { logWithCtx } from "@evil-cards/ctx-log"

import type { RedisClientType } from "redis"
import type { Logger, ReqContext } from "@evil-cards/ctx-log"

export type RedisClientWithLogs = Omit<RedisClientType, "duplicate"> & {
  withContext(ctx: ReqContext): RedisClientType
  duplicate(
    ...args: Parameters<RedisClientType["duplicate"]>
  ): RedisClientWithLogs
}

type CallableKeys<T> = keyof {
  [P in keyof T as T[P] extends () => unknown ? P : never]: unknown
}

type RedisKey = keyof RedisClientType
type RedisCommand = CallableKeys<RedisClientType>

function isCommand(
  redisClient: RedisClientType,
  key: string | symbol
): key is RedisCommand {
  if (key == "withContext") {
    return false
  }

  return key in redisClient && typeof redisClient[key as RedisKey] == "function"
}

export function getClientWithLogs(
  redisClient: RedisClientType,
  baseLog: Logger
): RedisClientWithLogs {
  const log = baseLog.child({ component: "redis" })

  const proxy = new Proxy(redisClient, {
    get(target, command, receiver) {
      if (!isCommand(target, command)) {
        return Reflect.get(target, command, receiver)
      }

      return getCommandWithLogs(target, command, log)
    }
  })

  return Object.assign(proxy, {
    withContext(ctx: ReqContext) {
      return new Proxy(redisClient, {
        get(target, command, receiver) {
          if (!isCommand(target, command)) {
            return Reflect.get(target, command, receiver)
          }

          return getCommandWithLogs(target, command, logWithCtx(ctx, log))
        }
      })
    },
    duplicate(...args: Parameters<RedisClientType["duplicate"]>) {
      const duplicatedClient = redisClient.duplicate(...args)

      return getClientWithLogs(duplicatedClient, baseLog)
    }
  })
}

function getCommandWithLogs(
  target: RedisClientType,
  command: RedisCommand,
  log: Logger
) {
  return async (...args: unknown[]) => {
    try {
      const result = await Reflect.apply(target[command], target, args)

      log.info(
        {
          command,
          args,
          result
        },
        "finished redis command"
      )

      return result
    } catch (error) {
      log.error(
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
