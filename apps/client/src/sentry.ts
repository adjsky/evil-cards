import * as Sentry from "@sentry/browser"

import packageJson from "../package.json"

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    release: packageJson.version,
    tracesSampleRate: 0.1,
    sampleRate: 0.5
  })
}
