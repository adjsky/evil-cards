import { z } from "zod"

import { log } from "../fastify/index.ts"
import { fromPromise, fromThrowable } from "../neverthrow.ts"

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
    return fromPromise(
      this.client
        .multi()
        .hSet(hashKey, session.id, JSON.stringify(session))
        .addCommand([
          "EXPIREMEMBER",
          hashKey,
          session.id,
          subkeyExpireSeconds.toString()
        ])
        .exec(),
      (err) => err
    ).match(
      ([set, expire]) => {
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
      },
      (err) => {
        log.error(
          { err, sessionId: session.id, session },
          "Failed to set cached session"
        )

        return false
      }
    )
  }

  public async get(id: string) {
    return fromPromise(this.client.hGet(hashKey, id), (err) => err)
      .map((rawSession) => {
        if (!rawSession) {
          return
        }

        return safeParseRawSession(rawSession).match(
          (session) => session,
          (err) => {
            log.error({ err, sessionId: id }, "Failed to parse cached session")

            return undefined
          }
        )
      })
      .match(
        (session) => {
          if (session) {
            log.info(
              { sessionId: id, session },
              `Successfully got cached session`
            )
          }

          return session
        },
        (err) => {
          log.error({ err, sessionId: id }, "Failed to get cached session")

          return undefined
        }
      )
  }

  public async getAll() {
    return fromPromise(this.client.hGetAll(hashKey), (err) => err)
      .map((rawSessions) => {
        const parse = fromThrowable(() =>
          Object.values(rawSessions).map(parseRawSession)
        )

        return parse().match(
          (sessions) => sessions,
          (err) => {
            log.error(err, "Failed to parse all cached sessions")

            return null
          }
        )
      })
      .match(
        (sessions) => {
          if (!sessions) {
            return []
          }

          log.info({ sessions }, `Successfully got all cached sessions`)

          return sessions
        },
        (err) => {
          log.error(err, "Failed to get all cached sessions")

          return []
        }
      )
  }

  public async del(id: string) {
    return fromPromise(this.client.hDel(hashKey, id), (err) => err).match(
      (nDeleted) => {
        log.info({ sessionId: id, nDeleted }, `Deleted cached session`)

        return nDeleted == 1
      },
      (err) => {
        log.error({ err, sessionId: id }, "Failed to delete cached session")
        return false
      }
    )
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

const safeParseRawSession = fromThrowable(parseRawSession)
