import { getRequestMeta } from "./context.ts"
import { getFastifyInstance } from "./server.ts"

export function info(msg: string): void
export function info(obj: unknown, message: string): void
export function info(objOrMsg: unknown | string, message?: string) {
  getLogWithMeta()?.info(objOrMsg, message)
}

export function debug(msg: string): void
export function debug(obj: unknown, message: string): void
export function debug(objOrMsg: unknown | string, message?: string) {
  getLogWithMeta()?.debug(objOrMsg, message)
}

export function error(msg: string): void
export function error(obj: unknown, message: string): void
export function error(objOrMsg: unknown | string, message?: string) {
  getLogWithMeta()?.error(objOrMsg, message)
}

export function fatal(msg: string): void
export function fatal(obj: unknown, message: string): void
export function fatal(objOrMsg: unknown | string, message?: string) {
  getLogWithMeta()?.fatal(objOrMsg, message)
}

export function trace(msg: string): void
export function trace(obj: unknown, message: string): void
export function trace(objOrMsg: unknown | string, message?: string) {
  getLogWithMeta()?.trace(objOrMsg, message)
}

export function warn(msg: string): void
export function warn(obj: unknown, message: string): void
export function warn(objOrMsg: unknown | string, message?: string) {
  getLogWithMeta()?.warn(objOrMsg, message)
}

function getLogWithMeta() {
  const meta = getRequestMeta()
  const log = getFastifyInstance()?.log

  if (!log) {
    return
  }

  return log.child(meta)
}
