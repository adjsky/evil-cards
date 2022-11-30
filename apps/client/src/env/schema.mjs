// @ts-check
import z from "zod"

const zodTransformBoolean = () =>
  z
    .string()
    .optional()
    .transform((v) => v == "true")

/**
 * Specify your server-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
export const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  BUILD_STANDALONE: zodTransformBoolean(),
  ANALYZE: zodTransformBoolean()
})

/**
 * Specify your client-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 * To expose them to the client, prefix them with `NEXT_PUBLIC_`.
 */
export const clientSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]),
    NEXT_PUBLIC_WS_HOST: z.string(),
    NEXT_PUBLIC_ANAL_KEY: z.string(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
    NEXT_PUBLIC_IS_PRODUCTION: z.boolean()
  })
  .refine(
    (args) =>
      (args.NEXT_PUBLIC_IS_PRODUCTION && args.NEXT_PUBLIC_SENTRY_DSN) ||
      !args.NEXT_PUBLIC_IS_PRODUCTION,
    {
      message:
        "NEXT_PUBLIC_SENTRY_DSN must be provided in production environment"
    }
  )
