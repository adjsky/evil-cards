import { ValidateEnv } from "@julr/vite-plugin-validate-env"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import { ViteEjsPlugin } from "vite-plugin-ejs"
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

    ValidateEnv()
  ],
  server: {
    host: true,
    port: 3000
  }
})
