import Fastify from "fastify"
import fastifyCompress from "@fastify/compress"
import fastifyCors from "@fastify/cors"
import fastifyMetrics from "fastify-metrics"
import getLogger from "./logger.ts"

import type { Options as LoggerOptions } from "./logger.ts"

type Options = {
  logger?: LoggerOptions
  cors?: {
    origin: string
  }
}

export async function getFastifyServer(options: Options) {
  const fastify = Fastify({
    logger: options.logger ? getLogger(options.logger) : false
  })

  await fastify.register(fastifyCompress)

  if (options.cors) {
    await fastify.register(fastifyCors, {
      origin: options.cors.origin
    })
  }

  await fastify.register(fastifyMetrics)

  return fastify
}
