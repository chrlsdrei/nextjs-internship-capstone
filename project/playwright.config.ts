import { defineConfig, devices } from "@playwright/test"
import { config as loadEnvironment } from "dotenv"

loadEnvironment({ path: ".env.local", quiet: true })

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000)
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `pnpm build && pnpm exec next start --hostname localhost --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    {
      name: "clerk-setup",
      testMatch: /clerk\.setup\.ts/,
    },
    {
      name: "auth-setup",
      testMatch: /auth\.setup\.ts/,
      dependencies: ["clerk-setup"],
    },
    {
      name: "public-chromium",
      testMatch: /public\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["clerk-setup"],
    },
    {
      name: "authenticated-chromium",
      testMatch: /authenticated\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.clerk/user.json",
      },
      dependencies: ["auth-setup"],
    },
  ],
})
