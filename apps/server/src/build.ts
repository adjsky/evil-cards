import redis from "redis"
import { env } from "./env.ts"

import type { RedisClientType } from "redis"

export function buildRedisClient(): RedisClientType {
  return redis.createClient({ url: env.REDIS_URL })
}
