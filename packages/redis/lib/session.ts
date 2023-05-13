import { Option } from "@evil-cards/fp"
import { z } from "zod"

import type { RedisClientWithLogs } from "./client-with-logs"
import type { ReqContext } from "@evil-cards/ctx-log"

const expireSeconds = 21600 // 6h

const sessionSchema = z.object({
  id: z.string(),
  server: z.number(),
  playing: z.boolean(),
  players: z.number()
})

type Session = z.infer<typeof sessionSchema>

type SessionMethods = {
  set(ctx: ReqContext, session: Session): Promise<boolean>
  get(ctx: ReqContext, id: string): Promise<Option<Session>>
  del(ctx: ReqContext, id: string): Promise<Option<number>>
}

function formatKey(id: string) {
  return `session:${id}`
}

export function initialize(redis: RedisClientWithLogs): SessionMethods {
  return {
    async set(ctx, session) {
      const result = await Option.asyncTryCatch(() =>
        redis.set(ctx, formatKey(session.id), JSON.stringify(session), {
          EX: expireSeconds
        })
      )

      return result.some
    },
    async get(ctx: ReqContext, id: string) {
      const rawSessionOption = await Option.asyncTryCatch(() =>
        redis.get(ctx, formatKey(id))
      )
      if (rawSessionOption.none) {
        return Option.none()
      }

      const rawSession = rawSessionOption.unwrap()
      if (rawSession == null) {
        return Option.none()
      }

      const parsedSession = Option.tryCatch(() => JSON.parse(rawSession))
      if (parsedSession.none) {
        return Option.none()
      }

      const session = sessionSchema.safeParse(parsedSession.unwrap())
      if (!session.success) {
        return Option.none()
      }

      return Option.some(session.data)
    },
    del(ctx, id) {
      return Option.asyncTryCatch(() => redis.del(ctx, formatKey(id)))
    }
  }
}
