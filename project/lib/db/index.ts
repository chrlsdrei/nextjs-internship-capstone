import "server-only"

import { neon } from "@neondatabase/serverless"
import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"

import * as schema from "./schema"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured")
}

const client = neon(databaseUrl)

export const db = drizzle({ client, schema })

export async function checkDatabaseConnection() {
  await db.execute(sql`select 1 as connected`)
  return true
}
