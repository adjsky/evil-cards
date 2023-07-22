import * as Sentry from "@sentry/nextjs"

import { env } from "@/lib/env/client.mjs"

const dsn =
  "https://063277161bd3490ba15d016fb4bd6c4c@o4504243834650624.ingest.sentry.io/4504243838713856"

Sentry.init({
  dsn: env.NEXT_PUBLIC_WITH_SENTRY ? dsn : "",
  tracesSampleRate: 0.1,
  sampleRate: 0.5
})
