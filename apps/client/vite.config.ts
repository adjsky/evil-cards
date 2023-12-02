import { ValidateEnv } from "@julr/vite-plugin-validate-env"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import { ViteEjsPlugin } from "vite-plugin-ejs"
import { VitePWA } from "vite-plugin-pwa"
import svgr from "vite-plugin-svgr"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    svgr({
      svgrOptions: {
        svgoConfig: {
          plugins: [
            {
              name: "preset-default",
              params: {
                overrides: { removeViewBox: false }
              }
            }
          ]
        }
      }
    }),
    ViteEjsPlugin({
      withAnalytics: process.env.WITH_ANALYTICS == "true"
    }),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false
      },
      includeManifestIcons: false,
      includeAssets: ["sounds/*", "avatars/*"],
      manifest: {
        name: "500 ЗЛОБНЫХ Карт Онлайн",
        short_name: "500 ЗЛОБНЫХ Карт",
        start_url: "/",
        display: "standalone",
        background_color: "#2A2A2A",
        theme_color: "#2A2A2A",
        description:
          "Онлайн версия игры «500 злобных карт»! Сыграй в эту весёлую игру бесплатно",
        icons: [
          { src: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
          { src: "/icons/icon-512.png", type: "image/png", sizes: "512x512" }
        ]
      }
    }),
    ValidateEnv()
  ],
  server: {
    host: true,
    port: 3000
  }
})
