import { neon } from "@neondatabase/serverless"
import { config } from "dotenv"

import { assertIsolatedTestDatabase, formatDatabaseIdentity } from "./lib/database-safety"

config({ path: ".env.local" })
config({ override: true, path: ".env.test.local" })

async function main() {
  if (!process.argv.includes("--execute")) {
    throw new Error("Test project reset requires the --execute flag")
  }

  const identity = assertIsolatedTestDatabase({
    applicationUrl: process.env.DATABASE_URL,
    testUrl: process.env.TEST_DATABASE_URL,
  })
  const sql = neon(process.env.TEST_DATABASE_URL as string)
  await sql`truncate table projects restart identity cascade`
  console.log(`Disposable test project data reset completed for ${formatDatabaseIdentity(identity)}.`)
}

main().catch((error) => {
  console.error("Test project data reset refused or failed.")
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
