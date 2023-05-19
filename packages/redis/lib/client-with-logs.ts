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

type CallableSyncKeys<T> = keyof {
  [P in keyof T as T[P] extends () => unknown
    ? T[P] extends () => Promise<unknown>
      ? never
      : P
    : never]: unknown
}

type CallableAsyncKeys<T> = keyof {
  [P in keyof T as T[P] extends () => Promise<unknown> ? P : never]: unknown
}

type Command = CallableKeys<RedisClientType>
type SyncCommand = CallableSyncKeys<RedisClientType>
type AsyncCommand = CallableAsyncKeys<RedisClientType>

const arrayOfAll =
  <T>() =>
  <U extends T[]>(array: U & ([T] extends [U[number]] ? unknown : "Invalid")) =>
    array

const arrayOfAllSyncCommands = arrayOfAll<SyncCommand>()

const syncCommands = arrayOfAllSyncCommands([
  "MULTI",
  "duplicate",
  "eventNames",
  "getMaxListeners",
  "multi",
  "ref",
  "removeAllListeners",
  "scanIterator",
  "unref"
])

const commandsToIgnore = ["withContext"]

function isAsyncCommand(
  redisClient: RedisClientType,
  command: string | symbol
): command is AsyncCommand {
  if (typeof command == "string" && commandsToIgnore.includes(command)) {
    return false
  }

  return (
    typeof redisClient[command as Command] == "function" &&
    !isSyncCommand(command)
  )
}

function isSyncCommand(command: string | symbol): command is SyncCommand {
  if (typeof command == "string" && commandsToIgnore.includes(command)) {
    return false
  }

  return syncCommands.findIndex((syncCommand) => syncCommand == command) != -1
}

export function getClientWithLogs(
  redisClient: RedisClientType,
  baseLog: Logger
): RedisClientWithLogs {
  const log = baseLog.child({ component: "redis" })

  const originalDuplicate = redisClient.duplicate.bind(redisClient)

  const handleGet = (
    target: RedisClientType,
    command: string | symbol,
    receiver: unknown,
    ctx?: ReqContext
  ) => {
    if (isSyncCommand(command)) {
      return getSyncCommandWithLogs(
        target,
        command,
        ctx ? logWithCtx(ctx, log) : log
      )
    }

    if (isAsyncCommand(target, command)) {
      return getAsyncCommandWithLogs(
        target,
        command,
        ctx ? logWithCtx(ctx, log) : log
      )
    }

    return Reflect.get(target, command, receiver)
  }

  const proxy = new Proxy(redisClient, {
    get(target, command, receiver) {
      return handleGet(target, command, receiver)
    }
  })

  return Object.assign(proxy, {
    withContext(ctx: ReqContext) {
      return new Proxy(redisClient, {
        get(target, command, receiver) {
          return handleGet(target, command, receiver, ctx)
        }
      })
    },
    duplicate(...args: Parameters<RedisClientType["duplicate"]>) {
      const duplicatedClient = originalDuplicate(...args)

      return getClientWithLogs(duplicatedClient, baseLog)
    }
  })
}

function getAsyncCommandWithLogs(
  target: RedisClientType,
  command: AsyncCommand,
  log: Logger
) {
  return async (...args: unknown[]) => {
    try {
      const result = await Reflect.apply(target[command], target, args)

      logResult(log, command, result, args)

      return result
    } catch (error) {
      logError(log, command, error, args)

      throw error
    }
  }
}

function getSyncCommandWithLogs(
  target: RedisClientType,
  command: SyncCommand,
  log: Logger
) {
  return (...args: unknown[]) => {
    try {
      const result = Reflect.apply(target[command], target, args)

      logResult(log, command, result, args)

      return result
    } catch (error) {
      logError(log, command, error, args)

      throw error
    }
  }
}

function logResult(
  log: Logger,
  command: Command,
  result: unknown,
  args: unknown[]
) {
  log.info(
    {
      command,
      args,
      result
    },
    "finished redis command"
  )
}

function logError(
  log: Logger,
  command: Command,
  error: unknown,
  args: unknown[]
) {
  log.error(
    {
      err: error,
      command,
      args
    },
    "received a redis error"
  )
}
