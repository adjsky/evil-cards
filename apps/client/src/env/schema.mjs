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
  ANALYZE: zodTransformBoolean(),
  WITH_PWA: zodTransformBoolean()
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
    NEXT_PUBLIC_PRODUCTION_HOST: z.string(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
    NEXT_PUBLIC_WITH_SENTRY: z.boolean(),
    NEXT_PUBLIC_WITH_ANALYTICS: z.boolean()
  })
  .refine(
    (args) => !args.NEXT_PUBLIC_WITH_SENTRY || args.NEXT_PUBLIC_SENTRY_DSN,
    {
      message: "NEXT_PUBLIC_SENTRY_DSN must be provided when sentry is enabled"
    }
  )
