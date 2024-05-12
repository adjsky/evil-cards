import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./suites",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    trace: "on-first-retry",
    permissions: ["clipboard-read", "clipboard-write"],
    baseURL: `http://${process.env.HOST}`
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
})
