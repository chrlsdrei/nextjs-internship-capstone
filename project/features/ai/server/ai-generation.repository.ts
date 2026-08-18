import "server-only"

import { randomUUID } from "node:crypto"
import { and, desc, eq, gte, sql } from "drizzle-orm"

import type { GeneratedBoard, GeneratedBoardSummary, GeneratedTask } from "@/features/ai/ai-usage.schema"
import type { BoardSummaryMetricsDto } from "@/features/ai/ai-usage.types"
import { db } from "@/server/db/client"
import { activityLogs, aiBoardSummaries } from "@/server/db/schema"

export async function insertGeneratedBoard(input: {
  workspaceId: string
  workspaceName: string
  actorName: string
  actorWorkspaceMemberId: string
  creatorIsOwner: boolean
  title: string
  description: string
  dueDate?: Date
  board: GeneratedBoard
  usage: { id: string; providerRequestId: string | null; inputTokens: number; outputTokens: number }
}) {
  const projectId = randomUUID()
  const lists = input.board.lists.map((list, position) => ({ id: randomUUID(), name: list.name, position }))
  const tasks = input.board.lists.flatMap((list, listPosition) =>
    list.tasks.map((task, position) => ({
      id: randomUUID(),
      listId: lists[listPosition].id,
      title: task.title,
      description: task.description,
      position,
    })),
  )
  const result = await db.execute<{ id: string }>(sql`
    WITH "inserted_project" AS (
      INSERT INTO "projects" ("id", "workspace_id", "title", "description", "created_by_workspace_member_id", "due_date")
      VALUES (${projectId}, ${input.workspaceId}, ${input.title}, ${input.description}, ${input.actorWorkspaceMemberId}, ${input.dueDate ?? null})
      RETURNING "id"
    ), "inserted_settings" AS (
      INSERT INTO "project_settings" ("project_id") SELECT "id" FROM "inserted_project" RETURNING "project_id"
    ), "inserted_membership" AS (
      INSERT INTO "project_members" ("workspace_id", "project_id", "workspace_member_id", "role")
      SELECT ${input.workspaceId}, "id", ${input.actorWorkspaceMemberId}, 'board_admin'
      FROM "inserted_project" WHERE NOT ${input.creatorIsOwner}
      RETURNING "id"
    ), "list_input" AS (
      SELECT * FROM jsonb_to_recordset(${JSON.stringify(lists)}::jsonb)
        AS value("id" uuid, "name" text, "position" integer)
    ), "inserted_lists" AS (
      INSERT INTO "lists" ("id", "name", "project_id", "position")
      SELECT "id", "name", ${projectId}, "position" FROM "list_input" RETURNING "id", "name"
    ), "task_input" AS (
      SELECT * FROM jsonb_to_recordset(${JSON.stringify(tasks)}::jsonb)
        AS value("id" uuid, "listId" uuid, "title" text, "description" text, "position" integer)
    ), "inserted_tasks" AS (
      INSERT INTO "tasks" ("id", "title", "description", "project_id", "list_id", "priority", "position")
      SELECT "id", "title", "description", ${projectId}, "listId", 'medium', "position" FROM "task_input"
      RETURNING "id", "title"
    ), "project_activity" AS (
      INSERT INTO "activity_logs" ("workspace_id", "project_id", "actor_workspace_member_id", "action", "metadata")
      SELECT ${input.workspaceId}, ${projectId}, ${input.actorWorkspaceMemberId}, 'project.created',
        ${JSON.stringify({ actorName: input.actorName, workspaceName: input.workspaceName, projectTitle: input.title })}::jsonb
      RETURNING "id"
    ), "list_activity" AS (
      INSERT INTO "activity_logs" ("workspace_id", "project_id", "actor_workspace_member_id", "action", "metadata")
      SELECT ${input.workspaceId}, ${projectId}, ${input.actorWorkspaceMemberId}, 'list.created',
        jsonb_build_object('actorName', ${input.actorName}::text, 'workspaceName', ${input.workspaceName}::text, 'projectTitle', ${input.title}::text, 'listName', "name")
      FROM "inserted_lists" RETURNING "id"
    ), "task_activity" AS (
      INSERT INTO "activity_logs" ("workspace_id", "project_id", "task_id", "actor_workspace_member_id", "action", "metadata")
      SELECT ${input.workspaceId}, ${projectId}, "id", ${input.actorWorkspaceMemberId}, 'task.created',
        jsonb_build_object('actorName', ${input.actorName}::text, 'workspaceName', ${input.workspaceName}::text, 'projectTitle', ${input.title}::text, 'taskTitle', "title")
      FROM "inserted_tasks" RETURNING "id"
    ), "usage_update" AS (
      UPDATE "ai_usage_logs" SET "status" = 'succeeded', "provider_request_id" = ${input.usage.providerRequestId},
        "result_resource_id" = ${projectId}, "input_tokens" = ${input.usage.inputTokens},
        "output_tokens" = ${input.usage.outputTokens}, "tokens_used" = ${input.usage.inputTokens + input.usage.outputTokens},
        "updated_at" = NOW()
      WHERE "id" = ${input.usage.id} AND "status" = 'pending' RETURNING "id"
    ) SELECT "inserted_project"."id" FROM "inserted_project" CROSS JOIN "usage_update"
  `)
  return result.rows[0]?.id ?? null
}

export async function insertGeneratedTasks(input: {
  workspaceId: string
  workspaceName: string
  projectId: string
  projectTitle: string
  listId: string
  actorName: string
  actorWorkspaceMemberId: string
  tasks: GeneratedTask[]
  usage: { id: string; providerRequestId: string | null; inputTokens: number; outputTokens: number }
}) {
  const values = input.tasks.map((task, offset) => ({ id: randomUUID(), ...task, offset }))
  const result = await db.execute<{ id: string }>(sql`
    WITH "board_lock" AS (SELECT pg_advisory_xact_lock(hashtext(${input.projectId}))), "task_input" AS (
      SELECT * FROM jsonb_to_recordset(${JSON.stringify(values)}::jsonb)
        AS value("id" uuid, "title" text, "description" text, "offset" integer)
    ), "authorized_list" AS (
      SELECT "lists"."id", COALESCE(MAX("tasks"."position") + 1, 0) AS "start_position"
      FROM "lists" CROSS JOIN "board_lock" LEFT JOIN "tasks" ON "tasks"."list_id" = "lists"."id"
      WHERE "lists"."id" = ${input.listId} AND "lists"."project_id" = ${input.projectId} GROUP BY "lists"."id"
    ), "inserted_tasks" AS (
      INSERT INTO "tasks" ("id", "title", "description", "project_id", "list_id", "priority", "position")
      SELECT "task_input"."id", "title", "description", ${input.projectId}, "authorized_list"."id", 'medium',
        "authorized_list"."start_position" + "offset" FROM "task_input" CROSS JOIN "authorized_list"
      RETURNING "id", "title"
    ), "task_activity" AS (
      INSERT INTO "activity_logs" ("workspace_id", "project_id", "task_id", "actor_workspace_member_id", "action", "metadata")
      SELECT ${input.workspaceId}, ${input.projectId}, "id", ${input.actorWorkspaceMemberId}, 'task.created',
        jsonb_build_object('actorName', ${input.actorName}::text, 'workspaceName', ${input.workspaceName}::text, 'projectTitle', ${input.projectTitle}::text, 'taskTitle', "title")
      FROM "inserted_tasks" RETURNING "id"
    ), "usage_update" AS (
      UPDATE "ai_usage_logs" SET "status" = 'succeeded', "provider_request_id" = ${input.usage.providerRequestId},
        "result_resource_id" = (SELECT "id" FROM "inserted_tasks" LIMIT 1),
        "input_tokens" = ${input.usage.inputTokens}, "output_tokens" = ${input.usage.outputTokens},
        "tokens_used" = ${input.usage.inputTokens + input.usage.outputTokens}, "updated_at" = NOW()
      WHERE "id" = ${input.usage.id} AND "status" = 'pending' RETURNING "id"
    ) SELECT "inserted_tasks"."id" FROM "inserted_tasks" CROSS JOIN "usage_update"
  `)
  return result.rows.map((row) => row.id)
}

export async function listRecentActivityForSummary(projectId: string, startsAt: Date) {
  return db
    .select({ action: activityLogs.action, metadata: activityLogs.metadata, createdAt: activityLogs.createdAt })
    .from(activityLogs)
    .where(and(eq(activityLogs.projectId, projectId), gte(activityLogs.createdAt, startsAt)))
    .orderBy(desc(activityLogs.createdAt))
    .limit(100)
}

export async function insertBoardSummary(input: {
  workspaceId: string
  projectId: string
  userId: string
  usageId: string
  metrics: BoardSummaryMetricsDto
  summary: GeneratedBoardSummary
  startsAt: Date
  endsAt: Date
  model: string
  providerRequestId: string | null
  inputTokens: number
  outputTokens: number
}) {
  const summaryId = randomUUID()
  const results = await db.batch([
    db
      .insert(aiBoardSummaries)
      .values({
        id: summaryId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        userId: input.userId,
        usageId: input.usageId,
        metrics: input.metrics,
        executiveSummary: input.summary.executiveSummary,
        progress: input.summary.progress,
        deadlineRisks: input.summary.deadlineRisks,
        unassignedWork: input.summary.unassignedWork,
        activityHighlights: input.summary.activityHighlights,
        suggestedActions: input.summary.suggestedActions,
        activityWindowStartsAt: input.startsAt,
        activityWindowEndsAt: input.endsAt,
        model: input.model,
      })
      .returning(),
    db.execute(sql`
      UPDATE "ai_usage_logs" SET "status" = 'succeeded', "provider_request_id" = ${input.providerRequestId},
        "result_resource_id" = ${summaryId}, "input_tokens" = ${input.inputTokens},
        "output_tokens" = ${input.outputTokens}, "tokens_used" = ${input.inputTokens + input.outputTokens},
        "updated_at" = NOW()
      WHERE "id" = ${input.usageId} AND "status" = 'pending'
    `),
  ])
  return results[0][0] ?? null
}

export async function listBoardSummaries(projectId: string, limit = 20) {
  return db
    .select()
    .from(aiBoardSummaries)
    .where(eq(aiBoardSummaries.projectId, projectId))
    .orderBy(desc(aiBoardSummaries.createdAt))
    .limit(limit)
}
