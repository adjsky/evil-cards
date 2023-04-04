// @ts-check
import z from "zod"

/**
 * Specify your server-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
export const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  BUILD_STANDALONE: z.coerce.boolean(),
  ANALYZE: z.coerce.boolean(),
  WITH_PWA: z.coerce.boolean()
})

/**
 * Specify your client-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 * To expose them to the client, prefix them with `NEXT_PUBLIC_`.
 */
export const clientSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  NEXT_PUBLIC_WS_HOST: z.string().optional(),
  NEXT_PUBLIC_SITE_HOST: z.string().url(),
  NEXT_PUBLIC_WITH_ANALYTICS: z.coerce.boolean(),
  NEXT_PUBLIC_WITH_SENTRY: z.coerce.boolean()
})
