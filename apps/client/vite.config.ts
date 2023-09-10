import { ValidateEnv } from "@julr/vite-plugin-validate-env"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
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
    ValidateEnv()
  ],
  server: {
    host: true,
    port: 3000
  }
})
