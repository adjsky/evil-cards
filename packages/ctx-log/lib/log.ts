import type { FastifyBaseLogger } from "fastify"
import type { ReqContext } from "./context.ts"

export function logWithCtx(ctx: ReqContext, log: FastifyBaseLogger) {
  return log.child(ctx)
}

export type Logger = FastifyBaseLogger
