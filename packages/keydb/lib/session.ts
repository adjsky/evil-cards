import { Option } from "@evil-cards/fp"
import { z } from "zod"
import { createInternalCtx } from "@evil-cards/ctx-log"

import type { Client } from "./client"
import type { ReqContext } from "@evil-cards/ctx-log"

export type CachedSession = z.infer<typeof sessionSchema>
type Listener = (sessions: CachedSession[]) => void
export type Subscribe = (listener: Listener) => Cleanup

type Cleanup = () => void
type AsyncCleanup = () => Promise<void>

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
  speed: z.enum(["fast", "normal", "slow"])
})

export class SessionCache {
  private client: Client

  constructor(client: Client) {
    this.client = client
  }

  public async set(ctx: ReqContext, session: CachedSession) {
    const result = await Option.asyncTryCatch(() =>
      this.client
        .withContext(ctx)
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

    if (!result.some) {
      return false
    }

    const [set, expire] = result.unwrap()

    return set == "1" && expire == "1"
  }

  public async get(
    ctx: ReqContext,
    id: string
  ): Promise<Option<CachedSession>> {
    const rawSessionOption = await Option.asyncTryCatch(() =>
      this.client.withContext(ctx).hGet(hashKey, id)
    )
    if (rawSessionOption.none) {
      return Option.none()
    }

    const rawSession = rawSessionOption.unwrap()
    if (rawSession == null) {
      return Option.none()
    }

    return parseRawSession(rawSession)
  }

  public async getAll(ctx: ReqContext): Promise<Option<CachedSession[]>> {
    const rawSessions = await Option.asyncTryCatch(() =>
      this.client.withContext(ctx).hGetAll(hashKey)
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
  }

  public async del(ctx: ReqContext, id: string) {
    return Option.asyncTryCatch(() =>
      this.client.withContext(ctx).hDel(hashKey, id)
    )
  }

  public async initializeSubscriber(): Promise<
    Option<[Subscribe, AsyncCleanup]>
  > {
    const subscriber = await Option.asyncTryCatch(async () => {
      const subscriber = this.client.duplicate()
      await subscriber.connect()

      return subscriber
    })

    if (subscriber.none) {
      return Option.none()
    }

    let listeners: Listener[] = []

    const rawListener = async () => {
      const ctx = createInternalCtx()
      const sessions = await this.getAll(ctx)

      if (sessions.none) {
        return
      }

      listeners.forEach((listener) => listener(sessions.unwrap()))
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
