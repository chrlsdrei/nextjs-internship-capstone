import "server-only"

import { type SQL, sql } from "drizzle-orm"

import { db } from "@/server/db/client"

export function canManageBoard(projectId: string, userId: string) {
  return sql`EXISTS (
    SELECT 1 FROM "project_members" AS "membership"
    WHERE "membership"."project_id" = ${projectId}
      AND "membership"."user_id" = ${userId}
      AND "membership"."role" IN ('owner', 'admin')
  )`
}

export function canWorkOnTasks(projectId: string, userId: string) {
  return sql`EXISTS (
    SELECT 1 FROM "project_members" AS "membership"
    WHERE "membership"."project_id" = ${projectId}
      AND "membership"."user_id" = ${userId}
      AND "membership"."role" IN ('owner', 'admin', 'member')
  )`
}

export function validAssignee(projectId: string, assigneeId: string | null | undefined) {
  if (!assigneeId) return sql`TRUE`
  return sql`EXISTS (
    SELECT 1 FROM "project_members" AS "assignee_membership"
    WHERE "assignee_membership"."project_id" = ${projectId}
      AND "assignee_membership"."user_id" = ${assigneeId}
  )`
}

export function orderedUuids(ids: string[]) {
  return sql`SELECT "input"."id", ("input"."ordinality" - 1)::integer AS "position"
    FROM unnest(ARRAY[${sql.join(
      ids.map((id) => sql`${id}`),
      sql`, `,
    )}]::uuid[]) WITH ORDINALITY AS "input"("id", "ordinality")`
}

export async function executeLockedBoardWrite<T extends Record<string, unknown>>(projectId: string, mutation: SQL) {
  const [, result] = await db.batch([
    db.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`project-write:${projectId}`}, 0))`),
    db.execute<T>(mutation),
  ])
  return result.rows
}
