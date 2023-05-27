import arrayOfAll from "./array-of-all.ts"

import type { Logger } from "@evil-cards/ctx-log"
import type { RedisClientType } from "redis"
import type {
  CallableKeys,
  CallableAsyncKeys,
  CallableSyncKeys
} from "./types.ts"

type SyncCommand = CallableSyncKeys<RedisClientType>

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
const commandsToIgnore = ["withContext", "multi", "duplicate"]

export function getHandler(log: Logger) {
  return (
    target: RedisClientType,
    command: string | symbol,
    receiver: unknown
  ) => {
    if (!clientHas(command, target)) {
      return undefined
    }

    if (!isCommand(command, target)) {
      return Reflect.get(target, command, receiver)
    }

    if (commandsToIgnore.includes(command)) {
      return (...args: unknown[]) =>
        Reflect.apply(target[command], target, args)
    }

    if (isCommandSync(command)) {
      return wrapSyncCommand(command, target, log)
    }

    return wrapAsyncCommand(command, target, log)
  }
}

function clientHas(
  command: string | symbol,
  client: RedisClientType
): command is keyof RedisClientType {
  return command in client
}

function isCommand(
  command: keyof RedisClientType,
  client: RedisClientType
): command is CallableKeys<RedisClientType> {
  return typeof client[command] == "function"
}

function isCommandSync(
  command: keyof RedisClientType
): command is CallableSyncKeys<RedisClientType> {
  return syncCommands.findIndex((syncCommand) => syncCommand == command) != -1
}

function wrapAsyncCommand(
  command: CallableAsyncKeys<RedisClientType>,
  target: RedisClientType,
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

function wrapSyncCommand(
  command: CallableSyncKeys<RedisClientType>,
  target: RedisClientType,
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
  command: unknown,
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
  command: unknown,
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
