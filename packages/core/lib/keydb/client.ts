import redis from "redis"

export function createClient(url: string) {
  return redis.createClient({ url })
}

export type RedisClient = ReturnType<typeof createClient>
