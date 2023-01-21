import * as Sentry from "@sentry/nextjs"
import { env } from "./src/env/client.mjs"

Sentry.init({
  dsn: env.NEXT_PUBLIC_WITH_SENTRY ? env.NEXT_PUBLIC_SENTRY_DSN : "",
  tracesSampleRate: 0.1,
  sampleRate: 0.5
})
