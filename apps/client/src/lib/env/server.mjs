// @ts-check
import formatErrors from "./format-errors.mjs"
import { serverSchema } from "./schema.mjs"

const _serverEnv = serverSchema.safeParse(process.env)

if (_serverEnv.success === false) {
  console.error(
    "❌ Invalid environment variables:\n",
    ...formatErrors(_serverEnv.error.format())
  )
  throw new Error("Invalid environment variables")
}

/**
 * Validate that server-side environment variables are not exposed to the client.
 */
for (let key of Object.keys(_serverEnv.data)) {
  if (key.startsWith("NEXT_PUBLIC_")) {
    console.warn("❌ You are exposing a server-side env-variable:", key)

    throw new Error("You are exposing a server-side env-variable")
  }
}

export const env = _serverEnv.data
