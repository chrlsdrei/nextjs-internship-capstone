import { neon } from "@neondatabase/serverless"
import { config } from "dotenv"

config({ path: ".env.local" })

const expectedTables = [
  "activity_logs",
  "ai_usage_logs",
  "ai_board_summaries",
  "billing_customers",
  "billing_checkout_purchases",
  "billing_plans",
  "billing_subscriptions",
  "billing_webhook_events",
  "calendar_events",
  "labels",
  "lists",
  "project_members",
  "project_settings",
  "projects",
  "rate_limit_buckets",
  "task_assignees",
  "task_comments",
  "task_labels",
  "tasks",
  "users",
  "workspace_invitations",
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
        'activity_logs', 'ai_board_summaries', 'ai_usage_logs', 'billing_checkout_purchases', 'billing_customers', 'billing_plans',
        'billing_subscriptions', 'billing_webhook_events', 'calendar_events', 'labels', 'lists', 'project_members', 'project_settings', 'projects',
        'rate_limit_buckets', 'task_assignees', 'task_comments', 'task_labels', 'tasks', 'users', 'workspace_invitations',
        'workspace_members', 'workspace_settings', 'workspaces'
      )
    order by table_name
  `
  const actualTables = rows.map((row) => String(row.table_name))
  const missingTables = expectedTables.filter((table) => !actualTables.includes(table))

  if (missingTables.length > 0) {
    throw new Error(`Database is missing expected tables: ${missingTables.join(", ")}`)
  }

  const [
    legacyAssigneeColumn,
    assignmentTrigger,
    legacyCommentsTable,
    quotaFunction,
    subscriptionColumns,
    tierTriggers,
  ] = await Promise.all([
    sql`
      select column_name
      from information_schema.columns
      where table_schema = 'public' and table_name = 'tasks' and column_name = 'assignee_id'
    `,
    sql`
      select trigger_name
      from information_schema.triggers
      where event_object_schema = 'public'
        and event_object_table = 'task_assignees'
        and trigger_name = 'task_assignees_require_active_membership'
      limit 1
    `,
    sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public' and table_name = 'comments'
    `,
    sql`
      select routine_name
      from information_schema.routines
      where routine_schema = 'public' and routine_name = 'reserve_ai_usage'
      limit 1
    `,
    sql`
      select table_name, column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name in ('users', 'workspaces')
        and column_name in ('subscription_tier', 'subscription_started_at', 'subscription_ends_at')
    `,
    sql`
      select trigger_name
      from information_schema.triggers
      where event_object_schema = 'public'
        and trigger_name in ('users_subscription_tier_period', 'workspaces_subscription_tier_period')
    `,
  ])
  if (legacyAssigneeColumn.length > 0) throw new Error("Database still contains the legacy tasks.assignee_id column")
  if (assignmentTrigger.length === 0) throw new Error("Database is missing active task-assignee enforcement")
  if (legacyCommentsTable.length > 0) throw new Error("Database still contains the legacy comments table")
  if (quotaFunction.length > 0) throw new Error("Database still contains the obsolete monthly AI quota function")
  if (subscriptionColumns.length !== 6) throw new Error("Database is missing simple subscription-tier columns")
  if (tierTriggers.length !== 2) throw new Error("Database is missing subscription-tier period triggers")

  console.log(`Database connection successful. Verified tables: ${actualTables.join(", ")}.`)
}

main().catch((error) => {
  console.error("Database connection failed.", error)
  process.exitCode = 1
})
