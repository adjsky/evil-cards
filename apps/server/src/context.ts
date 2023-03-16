import type { FastifyBaseLogger, FastifyRequest } from "fastify"

export type ReqContext = {
  reqId: string
}

export function createCtxFromReq(req: FastifyRequest): ReqContext {
  return {
    reqId: req.id
  }
}

export function logWithCtx(ctx: ReqContext, log: FastifyBaseLogger) {
  return log.child(ctx)
}
