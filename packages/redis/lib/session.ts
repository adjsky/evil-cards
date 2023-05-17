import { Option } from "@evil-cards/fp"
import { z } from "zod"

import type { RedisClientWithLogs } from "./client-with-logs"
import type { ReqContext } from "@evil-cards/ctx-log"

const sessionSchema = z.object({
  id: z.string(),
  server: z.number(),
  playing: z.boolean(),
  players: z.number()
})

const sessionsSchema = z.array(sessionSchema)

export type CachedSession = z.infer<typeof sessionSchema>

export type SessionCache = {
  set(ctx: ReqContext, session: CachedSession): Promise<boolean>
  get(ctx: ReqContext, id: string): Promise<Option<CachedSession>>
  del(ctx: ReqContext, id: string): Promise<Option<number>>
  subscribe(listener: (sessions: CachedSession[]) => void): Promise<boolean>
}

const hashKey = "session"

export function initializeSessionCache(
  redis: RedisClientWithLogs
): SessionCache {
  return {
    async set(ctx, session) {
      const result = await Option.asyncTryCatch(() =>
        redis
          .withContext(ctx)
          .hSet(hashKey, session.id, JSON.stringify(session))
      )

      return result.some
    },
    async get(ctx: ReqContext, id: string) {
      const rawSessionOption = await Option.asyncTryCatch(() =>
        redis.withContext(ctx).hGet(hashKey, id)
      )
      if (rawSessionOption.none) {
        return Option.none()
      }

      const rawSession = rawSessionOption.unwrap()
      if (rawSession == null) {
        return Option.none()
      }

      return parseRawSession(rawSession)
    },
    del(ctx, id) {
      return Option.asyncTryCatch(() =>
        redis.withContext(ctx).hDel(hashKey, id)
      )
    },
    async subscribe(listener) {
      const subscriber = await Option.asyncTryCatch(async () => {
        const subscriber = redis.duplicate()
        await subscriber.connect()

        return subscriber
      })

      if (subscriber.none) {
        return false
      }

      const subscribed = await Option.asyncTryCatch(() =>
        subscriber
          .unwrap()
          .pSubscribe(`__keyspace@*__:${hashKey}`, async () => {
            const rawSessions = await Option.asyncTryCatch(() =>
              redis.hGetAll(hashKey)
            )

            if (rawSessions.none) {
              return
            }

            const sessions = sessionsSchema.safeParse(rawSessions.unwrap())

            if (sessions.success) {
              listener(sessions.data)
            }
          })
      )

      return subscribed.some
    }
  }
}

function parseRawSession(rawSession: string): Option<CachedSession> {
  const parsedSession = Option.tryCatch(() => JSON.parse(rawSession))
  if (parsedSession.none) {
    return Option.none()
  }

  const session = sessionSchema.safeParse(parsedSession.unwrap())
  if (!session.success) {
    return Option.none()
  }

  return Option.some(session.data)
}
