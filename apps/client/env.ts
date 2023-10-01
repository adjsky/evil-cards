import { defineConfig } from "@julr/vite-plugin-validate-env"
import { z } from "zod"

export default defineConfig({
  validator: "zod",
  schema: {
    VITE_LOAD_BALANCER_PATH: z.string()
  }
})
