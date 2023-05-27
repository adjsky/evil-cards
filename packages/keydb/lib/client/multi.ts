import type { Logger } from "@evil-cards/ctx-log"
import type { RedisClientType } from "redis"
import type { CallableKeys } from "./types.ts"

type MultiClient = ReturnType<RedisClientType["multi"]>

export function getMultiProxyFactory(baseLog: Logger) {
  const log = baseLog.child({ component: "redis multi" })

  const factory = (client: MultiClient): MultiClient => {
    const proxy: MultiClient = new Proxy(client, {
      get(target, command, receiver) {
        if (!clientHas(command, target)) {
          return undefined
        }

        if (!isCommand(command, target)) {
          return Reflect.get(target, command, receiver)
        }

        if (
          command == "exec" ||
          command == "EXEC" ||
          command == "execAsPipeline"
        ) {
          return async (...args: unknown[]) => {
            try {
              const result = await Reflect.apply(target[command], target, args)

              log.info({ result }, "finished multi exec")

              return result
            } catch (error) {
              log.info({}, "failed multi exec")

              throw error
            }
          }
        }

        return (...args: unknown[]) => {
          Reflect.apply(target[command], target, args)

          log.info({ command, args }, "added command to multi")

          return proxy
        }
      }
    })

    return proxy
  }

  return factory
}

function clientHas(
  command: string | symbol,
  client: MultiClient
): command is keyof MultiClient {
  return command in client
}

function isCommand(
  command: keyof MultiClient,
  client: MultiClient
): command is CallableKeys<MultiClient> {
  return typeof client[command] == "function"
}
