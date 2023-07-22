import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    include: ["**/*.test.{ts,tsx}"],
    setupFiles: ["vitest.setup.ts"],
    globals: true,
    clearMocks: true
  }
})
