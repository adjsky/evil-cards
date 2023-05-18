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

  const originalDuplicate = redisClient.duplicate.bind(redisClient)

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
      const duplicatedClient = originalDuplicate(...args)

      return getClientWithLogs(duplicatedClient, baseLog)
    }
  })
}

function getCommandWithLogs(
  target: RedisClientType,
  command: RedisCommand,
  log: Logger
) {
  return (...args: unknown[]) => {
    const logResult = (result: unknown) => {
      log.info(
        {
          command,
          args,
          result
        },
        "finished redis command"
      )
    }

    const logError = (error: unknown) => {
      log.error(
        {
          err: error,
          command,
          args
        },
        "received a redis error"
      )
    }

    try {
      const result = Reflect.apply(target[command], target, args)

      if (result instanceof Promise) {
        result.then(logResult).catch((error) => {
          logError(error)
          throw error
        })
      } else {
        logResult(result)
      }

      return result
    } catch (error) {
      logError(error)

      throw error
    }
  }
}
