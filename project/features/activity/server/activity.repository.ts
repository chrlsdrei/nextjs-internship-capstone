import "server-only"

import { and, desc, eq, lt, or, sql } from "drizzle-orm"

import type { ActivityPageInput, CreateActivityInput } from "@/features/activity/activity.schema"
import { db } from "@/server/db/client"
import { activityLogs } from "@/server/db/schema"

export async function insertActivityRecord(input: CreateActivityInput) {
  const result = await db.execute<{ id: string }>(sql`
    INSERT INTO "activity_logs" (
      "workspace_id", "project_id", "task_id", "actor_workspace_member_id",
      "action", "schema_version", "metadata"
    )
    SELECT
      ${input.workspaceId}, ${input.projectId}, ${input.taskId}, ${input.actorWorkspaceMemberId},
      ${input.event.action}, 1, ${JSON.stringify(input.event.metadata)}::jsonb
    WHERE (
      ${input.actorWorkspaceMemberId}::uuid IS NULL
      OR EXISTS (
        SELECT 1 FROM "workspace_members"
        WHERE "id" = ${input.actorWorkspaceMemberId}
          AND "workspace_id" = ${input.workspaceId}
      )
    )
    AND (
      ${input.projectId}::uuid IS NULL
      OR EXISTS (
        SELECT 1 FROM "projects"
        WHERE "id" = ${input.projectId} AND "workspace_id" = ${input.workspaceId}
      )
    )
    AND (
      ${input.taskId}::uuid IS NULL
      OR EXISTS (
        SELECT 1 FROM "tasks"
        WHERE "id" = ${input.taskId}
          AND (${input.projectId}::uuid IS NULL OR "project_id" = ${input.projectId})
      )
    )
    RETURNING "id"
  `)
  return result.rows[0] ?? null
}

export async function listProjectActivityRecords(input: ActivityPageInput) {
  const cursorFilter = input.cursor
    ? or(
        lt(activityLogs.createdAt, input.cursor.createdAt),
        and(eq(activityLogs.createdAt, input.cursor.createdAt), lt(activityLogs.id, input.cursor.id)),
      )
    : undefined
  return db
    .select()
    .from(activityLogs)
    .where(and(eq(activityLogs.projectId, input.projectId), cursorFilter))
    .orderBy(desc(activityLogs.createdAt), desc(activityLogs.id))
    .limit(input.limit + 1)
}
