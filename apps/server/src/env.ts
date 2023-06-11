import * as dotenv from "dotenv"
import z from "zod"

import type { ZodFormattedError } from "zod"

dotenv.config({ path: `.env.${process.env.NODE_ENV}` })

const commonEnvSchema = z.object({
  PORT: z.coerce.number().default(8000),
  LOG_MEMORY: z.coerce.boolean(),
  SERVER_NUMBER: z.coerce.number().default(1),
  KEYDB_URL: z.string().url(),
  CORS_ORIGIN: z.string()
})

/**
 * Specify your environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
export const envSchema = z
  .discriminatedUnion("NODE_ENV", [
    z.object({
      NODE_ENV: z.enum(["development", "test"])
    }),
    z.object({
      NODE_ENV: z.literal("production"),
      LOKI_HOST: z.string(),
      LOKI_USERNAME: z.string(),
      LOKI_PASSWORD: z.string()
    })
  ])
  .and(commonEnvSchema)

const formatErrors = (errors: ZodFormattedError<Map<string, string>, string>) =>
  Object.entries(errors)
    .map(([name, value]) => {
      if (value && "_errors" in value)
        return `${name}: ${value._errors.join(", ")}\n`
    })
    .filter(Boolean)

const _env = envSchema.safeParse(process.env)
if (_env.success === false) {
  console.error(
    "❌ Invalid environment variables:\n",
    ...formatErrors(_env.error.format())
  )
  throw new Error("Invalid environment variables")
}

export const env = _env.data
