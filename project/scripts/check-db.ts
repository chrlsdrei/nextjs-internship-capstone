import { neon } from "@neondatabase/serverless"
import { config } from "dotenv"

config({ path: ".env.local" })

const expectedTables = [
  "ai_usage_logs",
  "comments",
  "lists",
  "project_members",
  "project_settings",
  "projects",
  "rate_limit_buckets",
  "tasks",
  "users",
  "workspace_members",
  "workspace_settings",
  "workspaces",
]

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured")
  }

  const sql = neon(databaseUrl)
  await sql`select 1 as connected`

  const rows = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'ai_usage_logs', 'comments', 'lists', 'project_members', 'project_settings', 'projects',
        'rate_limit_buckets', 'tasks', 'users',
        'workspace_members', 'workspace_settings', 'workspaces'
      )
    order by table_name
  `
  const actualTables = rows.map((row) => String(row.table_name))
  const missingTables = expectedTables.filter((table) => !actualTables.includes(table))

  if (missingTables.length > 0) {
    throw new Error(`Database is missing expected tables: ${missingTables.join(", ")}`)
  }

  console.log(`Database connection successful. Verified tables: ${actualTables.join(", ")}.`)
}

main().catch((error) => {
  console.error("Database connection failed.", error)
  process.exitCode = 1
})
