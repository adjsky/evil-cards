// @ts-check
import path from "node:path"
import url from "node:url"

import { withSentryConfig } from "@sentry/nextjs"

const workspaceRoot = path.resolve(
  path.dirname(url.fileURLToPath(import.meta.url)),
  "..",
  ".."
)

/**
 * @param {string} phase
 * @param {{ defaultConfig: object }} defaults
 */
const initializeConfig = async (phase, defaults) => {
  /** @type {import('next').NextConfig} */
  let nextConfig = {
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

  const clientEnv = (await import("./src/env/client.mjs")).env
  const serverEnv = (await import("./src/env/server.mjs")).env

  if (serverEnv.BUILD_STANDALONE) {
    nextConfig = {
      ...nextConfig,
      output: "standalone",
      experimental: {
        ...nextConfig.experimental,
        outputFileTracingRoot: workspaceRoot
      }
    }
  }

  if (serverEnv.ANALYZE) {
    const withBundleAnalyzer = (await import("@next/bundle-analyzer")).default()
    nextConfig = withBundleAnalyzer(nextConfig)
  }

  if (clientEnv.NEXT_PUBLIC_IS_PRODUCTION) {
    const nextConfigWithSentry = withSentryConfig(nextConfig, {
      silent: true
    })

    if (typeof nextConfigWithSentry == "function") {
      nextConfig = nextConfigWithSentry(phase, defaults)
    } else {
      nextConfig = nextConfigWithSentry
    }
  } else {
    // prevent warnings
    delete nextConfig.sentry
  }

  return nextConfig
}

export default initializeConfig
