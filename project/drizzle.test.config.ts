import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

import { assertIsolatedTestDatabase } from "./scripts/lib/database-safety"

config({ path: ".env.local" })
config({ override: true, path: ".env.test.local" })

const testDatabaseUrl = process.env.TEST_DATABASE_URL

assertIsolatedTestDatabase({
  applicationUrl: process.env.DATABASE_URL,
  testUrl: testDatabaseUrl,
})

export default defineConfig({
  schema: "./server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: testDatabaseUrl as string,
  },
  strict: true,
  verbose: true,
})
