import { requestContext } from "@fastify/request-context"

import type { RequestContextData } from "@fastify/request-context"

declare module "@fastify/request-context" {
  interface RequestContextData {
    meta: {
      reqId: string
      ip?: string
    }
  }
}

export function getRequestMeta(): RequestContextData["meta"] {
  return (
    requestContext.get("meta") ?? {
      reqId: "internal"
    }
  )
}
