import { neon } from "@neondatabase/serverless"
import { config } from "dotenv"

import {
  assertDevelopmentResetAllowed,
  DEVELOPMENT_RESET_CONFIRMATION,
  formatDatabaseIdentity,
} from "./lib/database-safety"

config({ path: ".env.local" })

function optionValue(name: string) {
  const optionIndex = process.argv.indexOf(name)
  return optionIndex === -1 ? undefined : process.argv[optionIndex + 1]
}

async function main() {
  const identity = assertDevelopmentResetAllowed({
    applicationUrl: process.env.DATABASE_URL,
    confirmation: optionValue("--confirm"),
    confirmedIdentity: optionValue("--database-identity"),
    configuredExpectedIdentity: process.env.DEVELOPMENT_RESET_DATABASE_IDENTITY,
    databaseEnvironment: process.env.DATABASE_ENVIRONMENT,
    execute: process.argv.includes("--execute"),
    nodeEnvironment: process.env.NODE_ENV,
    productionDatabaseUrl: process.env.PRODUCTION_DATABASE_URL,
    protectedDatabaseIdentities: process.env.PROTECTED_DATABASE_IDENTITIES,
    vercelEnvironment: process.env.VERCEL_ENV,
  })

  const databaseUrl = process.env.DATABASE_URL as string
  const sql = neon(databaseUrl)

  await sql`truncate table projects restart identity cascade`

  console.log(`Development project data reset completed for ${formatDatabaseIdentity(identity)}.`)
}

main().catch((error) => {
  console.error("Development data reset refused or failed.")
  if (error instanceof Error) {
    console.error(error.message)
  }
  console.error(
    `Required arguments: --execute --confirm ${DEVELOPMENT_RESET_CONFIRMATION} --database-identity <hostname:port/database>`,
  )
  process.exitCode = 1
})
