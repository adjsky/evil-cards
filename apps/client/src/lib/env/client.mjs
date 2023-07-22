// @ts-check
import formatErrors from "./format-errors.mjs"
import { clientSchema } from "./schema.mjs"

/**
 * You can't destruct `process.env` as a regular object, so you have to do
 * it manually here. This is because Next.js evaluates this at build time,
 * and only used environment variables are included in the build.
 * @type {{ [k in keyof import("zod").z.infer<typeof clientSchema>]: string | undefined }}
 */
const clientEnv = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_BALANCER_PATH: process.env.NEXT_PUBLIC_BALANCER_PATH,
  NEXT_PUBLIC_SITE_HOST: process.env.NEXT_PUBLIC_SITE_HOST,
  NEXT_PUBLIC_WITH_ANALYTICS: process.env.NEXT_PUBLIC_WITH_ANALYTICS,
  NEXT_PUBLIC_WITH_SENTRY: process.env.NEXT_PUBLIC_WITH_SENTRY
}

const _clientEnv = clientSchema.safeParse(clientEnv)

if (_clientEnv.success === false) {
  console.error(
    "❌ Invalid environment variables:\n",
    ...formatErrors(_clientEnv.error.format())
  )
  throw new Error("Invalid environment variables")
}

/**
 * Validate that client-side environment variables are exposed to the client.
 */
for (let key of Object.keys(_clientEnv.data)) {
  if (key == "NODE_ENV") continue // NODE_ENV is exposed to client by default

  if (!key.startsWith("NEXT_PUBLIC_")) {
    console.warn(
      `❌ Invalid public environment variable name: ${key}. It must begin with 'NEXT_PUBLIC_'`
    )

    throw new Error("Invalid public environment variable name")
  }
}

export const env = _clientEnv.data
