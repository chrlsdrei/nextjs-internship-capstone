import { config } from "dotenv"

import { assertIsolatedTestDatabase, formatDatabaseIdentity } from "../../scripts/lib/database-safety"

config({ path: ".env.local" })
config({ override: true, path: ".env.test.local" })

const identity = assertIsolatedTestDatabase({
  applicationUrl: process.env.DATABASE_URL,
  testUrl: process.env.TEST_DATABASE_URL,
})

process.env.VERIFIED_TEST_DATABASE_IDENTITY = formatDatabaseIdentity(identity)
