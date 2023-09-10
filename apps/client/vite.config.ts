import { ValidateEnv } from "@julr/vite-plugin-validate-env"
import { defineConfig as defineEnvConfig } from "@julr/vite-plugin-validate-env"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import svgr from "vite-plugin-svgr"
import tsconfigPaths from "vite-tsconfig-paths"
import { z } from "zod"

export const envConfig = defineEnvConfig({
  validator: "zod",
  schema: {
    VITE_LOAD_BALANCER_PATH: z.string(),
    VITE_WITH_ANALYTICS: z.coerce.boolean()
  }
})

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
    ValidateEnv(envConfig)
  ],
  server: {
    host: true,
    port: 3000
  }
})
