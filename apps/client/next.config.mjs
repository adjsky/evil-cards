// @ts-check
import path from "node:path"
import url from "node:url"

import { withSentryConfig } from "@sentry/nextjs"
import getWithBundleAnalyzer from "@next/bundle-analyzer"

const clientEnv = (await import("./src/env/client.mjs")).env
const serverEnv = (await import("./src/env/server.mjs")).env
const withBundleAnalyzer = getWithBundleAnalyzer({ enabled: serverEnv.ANALYZE })

const workspaceRoot = path.resolve(
  path.dirname(url.fileURLToPath(import.meta.url)),
  "..",
  ".."
)
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
  }
}

/**
 *
 * @param {import('next').NextConfig} nextConfig
 * @param {boolean} enabled
 */
function withStandaloneBuild(nextConfig, enabled) {
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

export default withSentryConfig(
  withStandaloneBuild(
    withBundleAnalyzer(nextConfig),
    serverEnv.BUILD_STANDALONE
  ),
  {
    silent: true,
    dryRun: !clientEnv.NEXT_PUBLIC_WITH_SENTRY
  }
)
