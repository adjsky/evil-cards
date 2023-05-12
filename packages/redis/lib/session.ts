import { ok, err } from "@evil-cards/fp/result"
import { z } from "zod"

import type { Result } from "@evil-cards/fp/result"
import type { RedisClientType } from "redis"

const key = "session"
const expireSeconds = 21600 // 6h

const redisSessionSchema = z.object({
  id: z.string(),
  server: z.number(),
  playing: z.boolean(),
  players: z.number()
})

type RedisSession = z.infer<typeof redisSessionSchema>

export function initialize(redis: RedisClientType) {
  return () => ({
    set(session: RedisSession)  {
      return redis.set()
    },
    get(id: string):  {},
    remove(id: string) {}
  })
}
