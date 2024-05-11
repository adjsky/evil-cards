import { z } from "zod"

import { fromPromise, fromThrowable } from "@evil-cards/core/resulto"

import { availableDecks } from "../deck-parser"
import { log } from "../fastify"

import type { RedisClient } from "@evil-cards/core/keydb"

export type CachedSession = z.infer<typeof sessionSchema>

type Listener = (sessions: CachedSession[]) => void
export type Subscriber = Awaited<
  ReturnType<SessionCache["initializeSubscriber"]>
>

const hashKey = "session"

const sessionSchema = z.object({
  id: z.string(),
  server: z.number(),
  playing: z.boolean(),
  players: z.number(),
  hostNickname: z.string(),
  hostAvatarId: z.number(),
  deck: z.enum([...availableDecks, "custom"]),
  speed: z.enum(["fast", "normal", "slow"]),
  public: z.boolean()
})

export type Session = z.infer<typeof sessionSchema>

export class SessionCache {
  private client: RedisClient

  constructor(client: RedisClient) {
    this.client = client
  }

  public async set(session: CachedSession) {
    return fromPromise(
      this.client.hSet(hashKey, session.id, JSON.stringify(session)),
      (err) => err
    ).match(
      (reply) => {
        log.info(
          {
            session,
            reply
          },
          `Set cached session`
        )

        return reply == 1
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

        return fromThrowable(() =>
          sessionSchema.parse(JSON.parse(rawSession))
        ).match(
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

  public async getAll(): Promise<Session[]> {
    return fromPromise(this.client.hGetAll(hashKey), (err) => err)
      .map((rawSessions) => {
        const sessions: Session[] = []

        for (const rawSession of Object.values(rawSessions)) {
          try {
            sessions.push(sessionSchema.parse(JSON.parse(rawSession)))
          } catch (err) {
            log.error(err, "Failed to parse session")
          }
        }

        return sessions
      })
      .unwrapOr([])
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
