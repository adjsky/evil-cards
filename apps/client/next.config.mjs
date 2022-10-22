// @ts-check
import {
  PHASE_PRODUCTION_BUILD,
  PHASE_DEVELOPMENT_SERVER
} from "next/constants.js"

/**
 * @param {string} phase
 */
const config = async (phase) => {
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    i18n: {
      locales: ["ru"],
      defaultLocale: "ru"
    }
  }

  if (phase == PHASE_PRODUCTION_BUILD || phase == PHASE_DEVELOPMENT_SERVER) {
    await import("./src/env/client.mjs")
    const serverEnv = (await import("./src/env/server.mjs")).env

    if (phase == PHASE_PRODUCTION_BUILD && serverEnv.BUILD_STANDALONE) {
      nextConfig.output = "standalone"
    }
  }

  return nextConfig
}

export default config
