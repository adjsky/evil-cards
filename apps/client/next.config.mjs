// @ts-check
import path from "node:path"
import url from "node:url"

import { withSentryConfig } from "@sentry/nextjs"
import getWithBundleAnalyzer from "@next/bundle-analyzer"
// @ts-expect-error @types/next-pwa are broken, due to that we have to suppress TS error
import getWithPWA from "next-pwa"

if (!process.env.SKIP_CLIENT_ENV_VALIDATION) {
  await import("./src/lib/env/client.mjs")
}
const serverEnv = (await import("./src/lib/env/server.mjs")).env

const workspaceRoot = path.resolve(
  path.dirname(url.fileURLToPath(import.meta.url)),
  "..",
  ".."
)

/**
 *
 * @param {boolean} enabled
 */
function getWithStandaloneBuild(enabled) {
  /**
   * @param {import('next').NextConfig} nextConfig
   */
  return (nextConfig) => {
    if (!enabled) {
      return nextConfig
    }

    return {
      ...nextConfig,
      output: "standalone",
      experimental: {
        ...nextConfig.experimental,
        outputFileTracingRoot: workspaceRoot
      }
    }
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  i18n: {
    locales: ["ru"],
    defaultLocale: "ru"
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"]
    })

    return config
  },
  sentry: {
    hideSourceMaps: true
  },
  eslint: {
    ignoreDuringBuilds: true
  }
}

const withBundleAnalyzer = getWithBundleAnalyzer({ enabled: serverEnv.ANALYZE })
const withPWA = getWithPWA({ dest: "public", disable: !serverEnv.WITH_PWA })
const withStandaloneBuild = getWithStandaloneBuild(serverEnv.BUILD_STANDALONE)

export default withSentryConfig(
  withPWA(withStandaloneBuild(withBundleAnalyzer(nextConfig))),
  {
    silent: true,
    dryRun: !process.env.NEXT_PUBLIC_WITH_SENTRY
  }
)
