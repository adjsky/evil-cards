// @ts-check
import {
  PHASE_PRODUCTION_BUILD,
  PHASE_DEVELOPMENT_SERVER
} from "next/constants.js"
import path from "node:path"
import url from "node:url"

const workspaceRoot = path.resolve(
  path.dirname(url.fileURLToPath(import.meta.url)),
  "..",
  ".."
)

/**
 * @param {string} phase
 */
const config = async (phase) => {
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
    }
  }

  if (phase == PHASE_PRODUCTION_BUILD || phase == PHASE_DEVELOPMENT_SERVER) {
    await import("./src/env/client.mjs")
    const serverEnv = (await import("./src/env/server.mjs")).env

    if (phase == PHASE_PRODUCTION_BUILD && serverEnv.BUILD_STANDALONE) {
      nextConfig = {
        ...nextConfig,
        output: "standalone",
        experimental: {
          ...nextConfig.experimental,
          outputFileTracingRoot: workspaceRoot
        }
      }
    }
  }

  if (phase == PHASE_PRODUCTION_BUILD) {
    const serverEnv = (await import("./src/env/server.mjs")).env

    if (serverEnv.ANALYZE) {
      const withBundleAnalyzer = (
        await import("@next/bundle-analyzer")
      ).default()
      nextConfig = withBundleAnalyzer(nextConfig)
    }
  }

  return nextConfig
}

export default config
