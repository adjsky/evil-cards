import * as Sentry from "@sentry/nextjs"
import { env } from "./src/env/client.mjs"

Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0
})
