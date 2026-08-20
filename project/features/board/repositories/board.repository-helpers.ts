import "server-only"

import { type SQL, sql } from "drizzle-orm"

import { db } from "@/server/db/client"

function authorizedProjectAccess(projectId: string, userId: string, allowedRoles: readonly string[]) {
  return sql`EXISTS (
    SELECT 1
    FROM "projects" AS "authorized_project"
    INNER JOIN "workspaces" AS "authorized_workspace"
      ON "authorized_workspace"."id" = "authorized_project"."workspace_id"
      AND "authorized_workspace"."status" = 'active'
    INNER JOIN "workspace_members" AS "actor_workspace_member"
      ON "actor_workspace_member"."workspace_id" = "authorized_project"."workspace_id"
      AND "actor_workspace_member"."user_id" = ${userId}
      AND "actor_workspace_member"."removed_at" IS NULL
    LEFT JOIN "project_members" AS "actor_project_member"
      ON "actor_project_member"."project_id" = "authorized_project"."id"
      AND "actor_project_member"."workspace_member_id" = "actor_workspace_member"."id"
      AND "actor_project_member"."removed_at" IS NULL
    WHERE "authorized_project"."id" = ${projectId}
      AND (
        "authorized_workspace"."owner_workspace_member_id" = "actor_workspace_member"."id"
        OR "actor_project_member"."role" IN (${sql.join(
          allowedRoles.map((role) => sql`${role}`),
          sql`, `,
        )})
      )
  )`
}

export function canManageBoard(projectId: string, userId: string) {
  return authorizedProjectAccess(projectId, userId, ["board_admin"])
}

export function canWorkOnTasks(projectId: string, userId: string) {
  return authorizedProjectAccess(projectId, userId, ["board_admin", "editor"])
}

export function canAssignTasks(projectId: string, userId: string) {
  return sql`EXISTS (
    SELECT 1
    FROM "projects" AS "authorized_project"
    INNER JOIN "project_settings" AS "settings" ON "settings"."project_id" = "authorized_project"."id"
    INNER JOIN "workspaces" AS "authorized_workspace"
      ON "authorized_workspace"."id" = "authorized_project"."workspace_id"
      AND "authorized_workspace"."status" = 'active'
    INNER JOIN "workspace_members" AS "actor_workspace_member"
      ON "actor_workspace_member"."workspace_id" = "authorized_project"."workspace_id"
      AND "actor_workspace_member"."user_id" = ${userId}
      AND "actor_workspace_member"."removed_at" IS NULL
    LEFT JOIN "project_members" AS "actor_project_member"
      ON "actor_project_member"."project_id" = "authorized_project"."id"
      AND "actor_project_member"."workspace_member_id" = "actor_workspace_member"."id"
      AND "actor_project_member"."removed_at" IS NULL
    WHERE "authorized_project"."id" = ${projectId}
      AND (
        "authorized_workspace"."owner_workspace_member_id" = "actor_workspace_member"."id"
        OR "actor_project_member"."role" = 'board_admin'
        OR ("actor_project_member"."role" = 'editor' AND "settings"."editors_can_assign_tasks")
      )
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
