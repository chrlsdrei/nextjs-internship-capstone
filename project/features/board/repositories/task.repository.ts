import "server-only"

import { sql } from "drizzle-orm"

import type { CreateTaskInput, MoveTaskInput, ReorderTasksInput, UpdateTaskInput } from "@/features/board/board.schema"
import {
  canAssignTasks,
  canManageBoard,
  canWorkOnTasks,
  executeLockedBoardWrite,
  orderedUuids,
} from "@/features/board/repositories/board.repository-helpers"

type CreateTaskRecordInput = Omit<CreateTaskInput, "assigneeIds" | "labelIds"> & {
  assigneeIds?: string[]
  labelIds?: string[]
}

export async function insertTask(projectId: string, actorId: string, values: CreateTaskRecordInput) {
  const assignmentAllowed = values.assigneeIds?.length ? canAssignTasks(projectId, actorId) : sql`TRUE`
  const assigneeIds = JSON.stringify(values.assigneeIds ?? [])
  const labelIds = JSON.stringify(values.labelIds ?? [])
  const rows = await executeLockedBoardWrite<{ id: string }>(
    projectId,
    sql`
      WITH "requested_assignees" AS (
        SELECT DISTINCT "value"::uuid AS "id"
        FROM jsonb_array_elements_text(${assigneeIds}::jsonb)
      ), "requested_labels" AS (
        SELECT DISTINCT "value"::uuid AS "id"
        FROM jsonb_array_elements_text(${labelIds}::jsonb)
      ), "authorized_list" AS (
        SELECT "list"."id", "actor_workspace_member"."id" AS "actor_workspace_member_id"
        FROM "lists" AS "list"
        INNER JOIN "projects" AS "project" ON "project"."id" = "list"."project_id"
        INNER JOIN "workspace_members" AS "actor_workspace_member"
          ON "actor_workspace_member"."workspace_id" = "project"."workspace_id"
          AND "actor_workspace_member"."user_id" = ${actorId}
          AND "actor_workspace_member"."removed_at" IS NULL
        WHERE "list"."id" = ${values.listId}
          AND "list"."project_id" = ${projectId}
          AND ${canWorkOnTasks(projectId, actorId)}
          AND ${assignmentAllowed}
          AND (SELECT COUNT(*) FROM "requested_assignees") = (
            SELECT COUNT(*) FROM "project_members" AS "assignee_project_member"
            INNER JOIN "workspace_members" AS "assignee_workspace_member"
              ON "assignee_workspace_member"."id" = "assignee_project_member"."workspace_member_id"
              AND "assignee_workspace_member"."removed_at" IS NULL
            INNER JOIN "requested_assignees" ON "requested_assignees"."id" = "assignee_project_member"."id"
            WHERE "assignee_project_member"."project_id" = ${projectId}
              AND "assignee_project_member"."removed_at" IS NULL
          )
          AND (SELECT COUNT(*) FROM "requested_labels") = (
            SELECT COUNT(*) FROM "labels" AS "label"
            INNER JOIN "requested_labels" ON "requested_labels"."id" = "label"."id"
            WHERE "label"."project_id" = ${projectId}
          )
      ), "inserted_task" AS (
        INSERT INTO "tasks" ("title", "description", "project_id", "list_id", "priority", "due_date", "position")
        SELECT ${values.title}, ${values.description ?? null}, ${projectId}, "authorized_list"."id",
          ${values.priority}, ${values.dueDate ?? null},
          COALESCE((SELECT MAX("position") + 1 FROM "tasks" WHERE "list_id" = "authorized_list"."id"), 0)
        FROM "authorized_list"
        RETURNING "id"
      ), "inserted_labels" AS (
        INSERT INTO "task_labels" ("project_id", "task_id", "label_id", "added_by_workspace_member_id")
        SELECT ${projectId}, "inserted_task"."id", "requested_labels"."id",
          "authorized_list"."actor_workspace_member_id"
        FROM "inserted_task"
        CROSS JOIN "requested_labels"
        CROSS JOIN "authorized_list"
        RETURNING "label_id"
      ), "inserted_assignees" AS (
        INSERT INTO "task_assignees" ("project_id", "task_id", "project_member_id", "assigned_by_workspace_member_id")
        SELECT ${projectId}, "inserted_task"."id", "requested_assignees"."id",
          "authorized_list"."actor_workspace_member_id"
        FROM "inserted_task"
        CROSS JOIN "requested_assignees"
        CROSS JOIN "authorized_list"
        RETURNING "project_member_id"
      )
      SELECT "inserted_task"."id", (SELECT COUNT(*) FROM "inserted_labels") AS "label_count",
        (SELECT COUNT(*) FROM "inserted_assignees") AS "assignee_count"
      FROM "inserted_task"
    `,
  )
  return rows[0] ?? null
}

export async function updateTaskRecord(projectId: string, actorId: string, taskId: string, values: UpdateTaskInput) {
  const assignmentAllowed = values.assigneeIds === undefined ? sql`TRUE` : canAssignTasks(projectId, actorId)
  const assignments = [
    values.title === undefined ? null : sql`"title" = ${values.title}`,
    values.description === undefined ? null : sql`"description" = ${values.description}`,
    values.priority === undefined ? null : sql`"priority" = ${values.priority}`,
    values.dueDate === undefined ? null : sql`"due_date" = ${values.dueDate}`,
    sql`"updated_at" = NOW()`,
  ].filter((assignment): assignment is ReturnType<typeof sql> => assignment !== null)
  const replaceLabels = values.labelIds !== undefined
  const replaceAssignees = values.assigneeIds !== undefined
  const labelIds = JSON.stringify(values.labelIds ?? [])
  const assigneeIds = JSON.stringify(values.assigneeIds ?? [])

  const rows = await executeLockedBoardWrite<{ id: string }>(
    projectId,
    sql`
      WITH "requested_assignees" AS (
        SELECT DISTINCT "value"::uuid AS "id"
        FROM jsonb_array_elements_text(${assigneeIds}::jsonb)
      ), "requested_labels" AS (
        SELECT DISTINCT "value"::uuid AS "id"
        FROM jsonb_array_elements_text(${labelIds}::jsonb)
      ), "valid_labels" AS (
        SELECT (SELECT COUNT(*) FROM "requested_labels") = (
          SELECT COUNT(*) FROM "labels" AS "label"
          INNER JOIN "requested_labels" ON "requested_labels"."id" = "label"."id"
          WHERE "label"."project_id" = ${projectId}
        ) AS "valid"
      ), "valid_assignees" AS (
        SELECT (SELECT COUNT(*) FROM "requested_assignees") = (
          SELECT COUNT(*) FROM "project_members" AS "assignee_project_member"
          INNER JOIN "workspace_members" AS "assignee_workspace_member"
            ON "assignee_workspace_member"."id" = "assignee_project_member"."workspace_member_id"
            AND "assignee_workspace_member"."removed_at" IS NULL
          INNER JOIN "requested_assignees" ON "requested_assignees"."id" = "assignee_project_member"."id"
          WHERE "assignee_project_member"."project_id" = ${projectId}
            AND "assignee_project_member"."removed_at" IS NULL
        ) AS "valid"
      ), "actor_membership" AS (
        SELECT "workspace_member"."id"
        FROM "projects" AS "project"
        INNER JOIN "workspace_members" AS "workspace_member"
          ON "workspace_member"."workspace_id" = "project"."workspace_id"
          AND "workspace_member"."user_id" = ${actorId}
          AND "workspace_member"."removed_at" IS NULL
        WHERE "project"."id" = ${projectId}
      ), "updated" AS (
        UPDATE "tasks" AS "task"
        SET ${sql.join(assignments, sql`, `)}
        WHERE "task"."id" = ${taskId}
          AND "task"."project_id" = ${projectId}
          AND ${canWorkOnTasks(projectId, actorId)}
          AND ${assignmentAllowed}
          AND (NOT ${replaceAssignees} OR (SELECT "valid" FROM "valid_assignees"))
          AND (NOT ${replaceLabels} OR (SELECT "valid" FROM "valid_labels"))
        RETURNING "task"."id" AS "id"
      ), "deleted_labels" AS (
        DELETE FROM "task_labels" AS "task_label"
        WHERE ${replaceLabels}
          AND "task_label"."task_id" = (SELECT "id" FROM "updated")
          AND "task_label"."project_id" = ${projectId}
          AND NOT EXISTS (
            SELECT 1 FROM "requested_labels" WHERE "requested_labels"."id" = "task_label"."label_id"
          )
        RETURNING "task_label"."label_id"
      ), "deleted_assignees" AS (
        DELETE FROM "task_assignees" AS "task_assignee"
        WHERE ${replaceAssignees}
          AND "task_assignee"."task_id" = (SELECT "id" FROM "updated")
          AND "task_assignee"."project_id" = ${projectId}
          AND NOT EXISTS (
            SELECT 1 FROM "requested_assignees"
            WHERE "requested_assignees"."id" = "task_assignee"."project_member_id"
          )
        RETURNING "task_assignee"."project_member_id"
      ), "inserted_labels" AS (
        INSERT INTO "task_labels" ("project_id", "task_id", "label_id", "added_by_workspace_member_id")
        SELECT ${projectId}, "updated"."id", "requested_labels"."id", "actor_membership"."id"
        FROM "updated"
        CROSS JOIN "requested_labels"
        CROSS JOIN "actor_membership"
        WHERE ${replaceLabels}
        ON CONFLICT ("task_id", "label_id") DO NOTHING
        RETURNING "label_id"
      ), "inserted_assignees" AS (
        INSERT INTO "task_assignees" ("project_id", "task_id", "project_member_id", "assigned_by_workspace_member_id")
        SELECT ${projectId}, "updated"."id", "requested_assignees"."id", "actor_membership"."id"
        FROM "updated"
        CROSS JOIN "requested_assignees"
        CROSS JOIN "actor_membership"
        WHERE ${replaceAssignees}
        ON CONFLICT ("task_id", "project_member_id") DO NOTHING
        RETURNING "project_member_id"
      )
      SELECT "updated"."id", (SELECT COUNT(*) FROM "deleted_labels") AS "deleted_label_count",
        (SELECT COUNT(*) FROM "inserted_labels") AS "inserted_label_count",
        (SELECT COUNT(*) FROM "deleted_assignees") AS "deleted_assignee_count",
        (SELECT COUNT(*) FROM "inserted_assignees") AS "inserted_assignee_count"
      FROM "updated"
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
