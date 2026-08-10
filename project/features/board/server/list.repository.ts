import "server-only"

import { sql } from "drizzle-orm"

import type { CreateListInput, ReorderListsInput, UpdateListInput } from "@/features/board/board.schema"
import { canManageBoard, executeLockedBoardWrite, orderedUuids } from "@/features/board/server/board.repository-helpers"
import { db } from "@/server/db/client"

export async function insertList(projectId: string, actorId: string, values: CreateListInput) {
  const rows = await executeLockedBoardWrite<{ id: string }>(
    projectId,
    sql`
      WITH "authorized_project" AS (
        SELECT ${projectId}::uuid AS "id" WHERE ${canManageBoard(projectId, actorId)}
      )
      INSERT INTO "lists" ("name", "project_id", "position")
      SELECT ${values.name}, "authorized_project"."id",
        COALESCE((SELECT MAX("position") + 1 FROM "lists" WHERE "project_id" = ${projectId}), 0)
      FROM "authorized_project"
      RETURNING "id"
    `,
  )
  return rows[0] ?? null
}

export async function updateListName(projectId: string, actorId: string, listId: string, values: UpdateListInput) {
  const { rows } = await db.execute<{ id: string }>(sql`
    UPDATE "lists" AS "list"
    SET "name" = ${values.name}, "updated_at" = NOW()
    WHERE "list"."id" = ${listId}
      AND "list"."project_id" = ${projectId}
      AND ${canManageBoard(projectId, actorId)}
    RETURNING "list"."id" AS "id"
  `)
  return rows[0] ?? null
}

export async function deleteListAndCompact(projectId: string, actorId: string, listId: string) {
  const rows = await executeLockedBoardWrite<{ id: string }>(
    projectId,
    sql`
      WITH "deleted" AS (
        DELETE FROM "lists" AS "list"
        WHERE "list"."id" = ${listId}
          AND "list"."project_id" = ${projectId}
          AND ${canManageBoard(projectId, actorId)}
        RETURNING "list"."id", "list"."position"
      ), "compacted" AS (
        UPDATE "lists" AS "list"
        SET "position" = "list"."position" - 1, "updated_at" = NOW()
        WHERE "list"."project_id" = ${projectId}
          AND "list"."position" > (SELECT "position" FROM "deleted")
        RETURNING "list"."id"
      )
      SELECT "id" FROM "deleted"
    `,
  )
  return rows[0] ?? null
}

export async function updateListOrder(projectId: string, actorId: string, values: ReorderListsInput) {
  const rows = await executeLockedBoardWrite<{ count: number }>(
    projectId,
    sql`
      WITH "ordered" AS (${orderedUuids(values.listIds)}), "updated" AS (
        UPDATE "lists" AS "list"
        SET "position" = "ordered"."position", "updated_at" = NOW()
        FROM "ordered"
        WHERE "list"."id" = "ordered"."id"
          AND "list"."project_id" = ${projectId}
          AND ${canManageBoard(projectId, actorId)}
          AND (SELECT COUNT(*) FROM "lists" WHERE "project_id" = ${projectId}) = ${values.listIds.length}
          AND (
            SELECT COUNT(*) FROM "ordered"
            INNER JOIN "lists" AS "ordered_list" ON "ordered_list"."id" = "ordered"."id"
            WHERE "ordered_list"."project_id" = ${projectId}
          ) = ${values.listIds.length}
        RETURNING "list"."id"
      )
      SELECT COUNT(*)::integer AS "count" FROM "updated"
    `,
  )
  return rows[0]?.count ?? 0
}
