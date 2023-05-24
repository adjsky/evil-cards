import { Option } from "@evil-cards/fp"
import { z } from "zod"

import type { RedisClientWithLogs } from "./client-with-logs"
import type { ReqContext } from "@evil-cards/ctx-log"

const sessionSchema = z.object({
  id: z.string(),
  server: z.number(),
  playing: z.boolean(),
  players: z.number(),
  hostNickname: z.string(),
  hostAvatarId: z.number(),
  adultOnly: z.boolean(),
  speed: z.enum(["fast", "normal", "slow"])
})

export type CachedSession = z.infer<typeof sessionSchema>

type Listener = (sessions: CachedSession[]) => void

export type Subscribe = (listener: Listener) => Cleanup

type Cleanup = () => void
type AsyncCleanup = () => Promise<void>

export type SessionCache = {
  set(ctx: ReqContext, session: CachedSession): Promise<boolean>
  get(ctx: ReqContext, id: string): Promise<Option<CachedSession>>
  getAll(ctx: ReqContext): Promise<Option<CachedSession[]>>
  del(ctx: ReqContext, id: string): Promise<Option<number>>
  initializeSubscriber(): Promise<Option<[Subscribe, AsyncCleanup]>>
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
    async get(ctx, id) {
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
    async getAll(ctx) {
      const rawSessions = await Option.asyncTryCatch(() =>
        redis.withContext(ctx).hGetAll(hashKey)
      )
      if (rawSessions.none) {
        return Option.none()
      }

      const parsedRawSessions = Option.tryCatch(() =>
        Object.values(rawSessions.unwrap()).map((rawSession) =>
          JSON.parse(rawSession)
        )
      )
      if (parsedRawSessions.none) {
        return Option.none()
      }

      const sessions: CachedSession[] = []
      for (const parsedRawSession of parsedRawSessions.unwrap()) {
        const result = sessionSchema.safeParse(parsedRawSession)

        if (result.success) {
          sessions.push(result.data)
        }
      }

      return Option.some(sessions)
    },
    del(ctx, id) {
      return Option.asyncTryCatch(() =>
        redis.withContext(ctx).hDel(hashKey, id)
      )
    },
    async initializeSubscriber() {
      const subscriber = await Option.asyncTryCatch(async () => {
        const subscriber = redis.duplicate()
        await subscriber.connect()

        return subscriber
      })

      if (subscriber.none) {
        return Option.none()
      }

      let listeners: Listener[] = []

      const rawListener = async () => {
        const rawSessions = await Option.asyncTryCatch(() =>
          redis.hGetAll(hashKey)
        )
        if (rawSessions.none) {
          return
        }

        const parsedRawSessions = Option.tryCatch(() =>
          Object.values(rawSessions.unwrap()).map((rawSession) =>
            JSON.parse(rawSession)
          )
        )
        if (parsedRawSessions.none) {
          return
        }

        const sessions: CachedSession[] = []
        for (const parsedRawSession of parsedRawSessions.unwrap()) {
          const result = sessionSchema.safeParse(parsedRawSession)

          if (result.success) {
            sessions.push(result.data)
          }
        }

        listeners.forEach((listener) => listener(sessions))
      }

      const subscribed = await Option.asyncTryCatch(() =>
        subscriber.unwrap().pSubscribe(`__keyspace@*__:${hashKey}`, rawListener)
      )

      if (subscribed.none) {
        return Option.none()
      }

      return Option.some([
        (listener) => {
          listeners.push(listener)

          return () => {
            listeners = listeners.filter((l) => listener != l)
          }
        },
        () => {
          return subscriber.unwrap().disconnect()
        }
      ])
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