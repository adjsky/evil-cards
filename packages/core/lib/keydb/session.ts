import { z } from "zod"

import { Result } from "@evil-cards/fp"

import { log } from "../fastify/index.ts"

import type { RedisClient } from "./client.ts"

export type CachedSession = z.infer<typeof sessionSchema>

type Listener = (sessions: CachedSession[]) => void
export type Subscriber = Awaited<
  ReturnType<SessionCache["initializeSubscriber"]>
>

const hashKey = "session"
const subkeyExpireSeconds = 60 * 60 // 2h

const sessionSchema = z.object({
  id: z.string(),
  server: z.number(),
  playing: z.boolean(),
  players: z.number(),
  hostNickname: z.string(),
  hostAvatarId: z.number(),
  adultOnly: z.boolean(),
  speed: z.enum(["fast", "normal", "slow"]),
  public: z.boolean()
})

export class SessionCache {
  private client: RedisClient

  constructor(client: RedisClient) {
    this.client = client
  }

  public async set(session: CachedSession) {
    const result = await Result.asyncTryCatch(() =>
      this.client
        .multi()
        .hSet(hashKey, session.id, JSON.stringify(session))
        .addCommand([
          "EXPIREMEMBER",
          hashKey,
          session.id,
          subkeyExpireSeconds.toString()
        ])
        .exec()
    )

    if (result.err) {
      log.error(
        { err: result.unwrapErr(), sessionId: session.id, session },
        "Failed to set cached session"
      )
      return false
    }

    const [set, expire] = result.unwrap()

    log.info(
      {
        sessionId: session.id,
        session,
        set,
        expire
      },
      `Set cached session`
    )

    return set == 1 && expire == 1
  }

  public async get(id: string) {
    const rawSessionResult = await Result.asyncTryCatch(() =>
      this.client.hGet(hashKey, id)
    )
    if (rawSessionResult.err) {
      log.error(
        { err: rawSessionResult.unwrapErr(), sessionId: id },
        "Failed to get cached session"
      )
      return undefined
    }

    const rawSession = rawSessionResult.unwrap()
    if (!rawSession) {
      return undefined
    }

    const parsedSessionResult = Result.tryCatch(() =>
      parseRawSession(rawSession)
    )
    if (parsedSessionResult.err) {
      log.error(
        { err: rawSessionResult.unwrapErr(), sessionId: id },
        "Failed to parse cached session"
      )
      return undefined
    }

    const session = parsedSessionResult.unwrap()

    log.info({ sessionId: id, session }, `Successfully got cached session`)

    return session
  }

  public async getAll() {
    const rawSessionsResult = await Result.asyncTryCatch(() =>
      this.client.hGetAll(hashKey)
    )
    if (rawSessionsResult.err) {
      log.error(
        { err: rawSessionsResult.unwrapErr() },
        "Failed to get all cached sessions"
      )
      return []
    }

    const parsedSessionsResult = Result.tryCatch(() =>
      Object.values(rawSessionsResult.unwrap()).map(parseRawSession)
    )
    if (parsedSessionsResult.err) {
      log.error(
        { err: rawSessionsResult.unwrapErr() },
        "Failed to parse all cached sessions"
      )
      return []
    }

    const sessions = parsedSessionsResult.unwrap()

    log.info({ sessions }, `Successfully got all cached sessions`)

    return sessions
  }

  public async del(id: string) {
    const result = await Result.asyncTryCatch(() =>
      this.client.hDel(hashKey, id)
    )
    if (result.err) {
      log.error(
        { err: result.unwrapErr(), sessionId: id },
        "Failed to delete cached session"
      )
      return false
    }

    const nDeleted = result.unwrap()

    log.info({ sessionId: id, nDeleted }, `Deleted cached session`)

    return nDeleted == 1
  }

  public async initializeSubscriber() {
    const subscriber = this.client.duplicate()
    await subscriber.connect()

    let listeners: Listener[] = []
    await subscriber.pSubscribe(`__keyspace@*__:${hashKey}`, async () => {
      const sessions = await this.getAll()

      listeners.forEach((listener) => listener(sessions))
    })

    log.info("Successfully initialized session cache subscriber")

    return [
      (listener: Listener) => {
        listeners.push(listener)

        return () => {
          listeners = listeners.filter((l) => listener != l)
        }
      },
      () => {
        return subscriber.disconnect()
      }
    ] as const
  }
}

function parseRawSession(rawSession: string) {
  return sessionSchema.parse(JSON.parse(rawSession))
}
