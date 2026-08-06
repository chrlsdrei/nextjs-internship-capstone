import "server-only"

import { sql } from "drizzle-orm"

import type { CreateTaskInput, MoveTaskInput, ReorderTasksInput, UpdateTaskInput } from "@/features/board/board.schema"
import {
  canAssignTasks,
  canManageBoard,
  canWorkOnTasks,
  executeLockedBoardWrite,
  orderedUuids,
  validAssignee,
} from "@/features/board/server/board.repository-helpers"

export async function insertTask(projectId: string, actorId: string, values: CreateTaskInput) {
  const assignmentAllowed = values.assigneeId ? canAssignTasks(projectId, actorId) : sql`TRUE`
  const rows = await executeLockedBoardWrite<{ id: string }>(
    projectId,
    sql`
      WITH "authorized_list" AS (
        SELECT "list"."id" FROM "lists" AS "list"
        WHERE "list"."id" = ${values.listId}
          AND "list"."project_id" = ${projectId}
          AND ${canWorkOnTasks(projectId, actorId)}
          AND ${assignmentAllowed}
          AND ${validAssignee(projectId, values.assigneeId)}
      )
      INSERT INTO "tasks" ("title", "description", "project_id", "list_id", "assignee_id", "priority", "due_date", "position")
      SELECT ${values.title}, ${values.description ?? null}, ${projectId}, "authorized_list"."id", ${values.assigneeId ?? null},
        ${values.priority}, ${values.dueDate ?? null},
        COALESCE((SELECT MAX("position") + 1 FROM "tasks" WHERE "list_id" = "authorized_list"."id"), 0)
      FROM "authorized_list"
      RETURNING "id"
    `,
  )
  return rows[0] ?? null
}

export async function updateTaskRecord(projectId: string, actorId: string, taskId: string, values: UpdateTaskInput) {
  const assignmentAllowed = values.assigneeId === undefined ? sql`TRUE` : canAssignTasks(projectId, actorId)
  const assignments = [
    values.title === undefined ? null : sql`"title" = ${values.title}`,
    values.description === undefined ? null : sql`"description" = ${values.description}`,
    values.assigneeId === undefined ? null : sql`"assignee_id" = ${values.assigneeId}`,
    values.priority === undefined ? null : sql`"priority" = ${values.priority}`,
    values.dueDate === undefined ? null : sql`"due_date" = ${values.dueDate}`,
    sql`"updated_at" = NOW()`,
  ].filter((assignment): assignment is ReturnType<typeof sql> => assignment !== null)

  const rows = await executeLockedBoardWrite<{ id: string }>(
    projectId,
    sql`
      UPDATE "tasks" AS "task"
      SET ${sql.join(assignments, sql`, `)}
      WHERE "task"."id" = ${taskId}
        AND "task"."project_id" = ${projectId}
        AND ${canWorkOnTasks(projectId, actorId)}
        AND ${assignmentAllowed}
        AND ${validAssignee(projectId, values.assigneeId)}
      RETURNING "task"."id" AS "id"
    `,
  )
  return rows[0] ?? null
}

export async function moveTaskRecord(projectId: string, actorId: string, taskId: string, values: MoveTaskInput) {
  const rows = await executeLockedBoardWrite<{ id: string }>(
    projectId,
    sql`
      WITH "authorized_task" AS (
        SELECT "task"."id", "task"."list_id" AS "source_list_id", "task"."position" AS "source_position"
        FROM "tasks" AS "task"
        INNER JOIN "lists" AS "source_list"
          ON "source_list"."id" = "task"."list_id" AND "source_list"."project_id" = "task"."project_id"
        INNER JOIN "lists" AS "target_list" ON "target_list"."id" = ${values.targetListId}
        WHERE "task"."id" = ${taskId}
          AND "source_list"."project_id" = ${projectId}
          AND "task"."project_id" = ${projectId}
          AND "target_list"."project_id" = ${projectId}
          AND "source_list"."id" <> "target_list"."id"
          AND ${canWorkOnTasks(projectId, actorId)}
      ), "destination" AS (
        SELECT COUNT(*)::integer AS "task_count" FROM "tasks" WHERE "list_id" = ${values.targetListId}
      ), "valid_move" AS (
        SELECT "authorized_task".*,
          COALESCE(${values.targetIndex ?? null}::integer, "destination"."task_count") AS "target_position"
        FROM "authorized_task"
        CROSS JOIN "destination"
        WHERE COALESCE(${values.targetIndex ?? null}::integer, "destination"."task_count")
          BETWEEN 0 AND "destination"."task_count"
      ), "compacted" AS (
        UPDATE "tasks" AS "task"
        SET "position" = "task"."position" - 1, "updated_at" = NOW()
        WHERE "task"."list_id" = (SELECT "source_list_id" FROM "valid_move")
          AND "task"."position" > (SELECT "source_position" FROM "valid_move")
        RETURNING "task"."id"
      ), "shifted" AS (
        UPDATE "tasks" AS "task"
        SET "position" = "task"."position" + 1, "updated_at" = NOW()
        WHERE "task"."list_id" = ${values.targetListId}
          AND "task"."position" >= (SELECT "target_position" FROM "valid_move")
        RETURNING "task"."id"
      ), "moved" AS (
        UPDATE "tasks" AS "task"
        SET "list_id" = ${values.targetListId},
            "position" = (SELECT "target_position" FROM "valid_move"),
            "updated_at" = NOW()
        WHERE "task"."id" = (SELECT "id" FROM "valid_move")
        RETURNING "task"."id"
      )
      SELECT "id" FROM "moved"
    `,
  )
  return rows[0] ?? null
}

export async function deleteTaskAndCompact(projectId: string, actorId: string, taskId: string) {
  const rows = await executeLockedBoardWrite<{ id: string }>(
    projectId,
    sql`
      WITH "deleted" AS (
        DELETE FROM "tasks" AS "task"
        WHERE "task"."id" = ${taskId}
          AND "task"."project_id" = ${projectId}
          AND ${canManageBoard(projectId, actorId)}
        RETURNING "task"."id", "task"."list_id", "task"."position"
      ), "compacted" AS (
        UPDATE "tasks" AS "task"
        SET "position" = "task"."position" - 1, "updated_at" = NOW()
        WHERE "task"."list_id" = (SELECT "list_id" FROM "deleted")
          AND "task"."position" > (SELECT "position" FROM "deleted")
        RETURNING "task"."id"
      )
      SELECT "id" FROM "deleted"
    `,
  )
  return rows[0] ?? null
}

export async function updateTaskOrder(projectId: string, actorId: string, listId: string, values: ReorderTasksInput) {
  const rows = await executeLockedBoardWrite<{ count: number }>(
    projectId,
    sql`
      WITH "ordered" AS (${orderedUuids(values.taskIds)}), "updated" AS (
        UPDATE "tasks" AS "task"
        SET "position" = "ordered"."position", "updated_at" = NOW()
        FROM "ordered"
        WHERE "task"."id" = "ordered"."id"
          AND "task"."list_id" = ${listId}
          AND "task"."project_id" = ${projectId}
          AND ${canWorkOnTasks(projectId, actorId)}
          AND (SELECT COUNT(*) FROM "tasks" WHERE "list_id" = ${listId}) = ${values.taskIds.length}
          AND (
            SELECT COUNT(*) FROM "ordered"
            INNER JOIN "tasks" AS "ordered_task" ON "ordered_task"."id" = "ordered"."id"
            WHERE "ordered_task"."list_id" = ${listId}
          ) = ${values.taskIds.length}
        RETURNING "task"."id"
      )
      SELECT COUNT(*)::integer AS "count" FROM "updated"
    `,
  )
  return rows[0]?.count ?? 0
}
