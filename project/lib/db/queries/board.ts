import "server-only"

import { and, asc, eq, sql } from "drizzle-orm"

import { getCurrentDatabaseUser } from "@/lib/auth"
import { executeProjectLockedWrite, ProjectAccessError, requireProjectPermission } from "@/lib/project-access"
import {
  listIdSchema,
  listSchema,
  moveTaskSchema,
  projectIdSchema,
  reorderListsSchema,
  reorderTasksSchema,
  taskIdSchema,
  taskSchema,
  updateListSchema,
  updateTaskSchema,
} from "@/lib/validations"

import { db } from "../index"
import { lists, projectMembers, tasks, users } from "../schema"

export type BoardMember = { id: string; name: string; email: string }
export type BoardTask = {
  id: string
  title: string
  description: string | null
  priority: "low" | "medium" | "high"
  dueDate: Date | null
  position: number
  assignee: BoardMember | null
}
export type BoardList = { id: string; name: string; position: number; tasks: BoardTask[] }
export type ProjectBoard = { lists: BoardList[]; members: BoardMember[]; role: "owner" | "admin" | "member" }

const parseProjectId = (value: string) => projectIdSchema.parse(value)
const parseListId = (value: string) => listIdSchema.parse(value)
const parseTaskId = (value: string) => taskIdSchema.parse(value)

function canManage(projectId: string, userId: string) {
  return sql`EXISTS (
    SELECT 1 FROM "project_members" AS "membership"
    WHERE "membership"."project_id" = ${projectId}
      AND "membership"."user_id" = ${userId}
      AND "membership"."role" IN ('owner', 'admin')
  )`
}

// Members can create, edit, move, and reorder tasks; list management and task deletion stay admin/owner-only.
function canWorkOnTasks(projectId: string, userId: string) {
  return sql`EXISTS (
    SELECT 1 FROM "project_members" AS "membership"
    WHERE "membership"."project_id" = ${projectId}
      AND "membership"."user_id" = ${userId}
      AND "membership"."role" IN ('owner', 'admin', 'member')
  )`
}

function isValidAssignee(projectId: string, assigneeId: string | null | undefined) {
  if (!assigneeId) return sql`TRUE`
  return sql`EXISTS (
    SELECT 1 FROM "project_members" AS "assignee_membership"
    WHERE "assignee_membership"."project_id" = ${projectId}
      AND "assignee_membership"."user_id" = ${assigneeId}
  )`
}

function orderedUuids(ids: string[]) {
  return sql`SELECT "input"."id", ("input"."ordinality" - 1)::integer AS "position"
    FROM unnest(ARRAY[${sql.join(
      ids.map((id) => sql`${id}`),
      sql`, `,
    )}]::uuid[]) WITH ORDINALITY AS "input"("id", "ordinality")`
}

export async function getProjectBoard(projectId: string): Promise<ProjectBoard> {
  const id = parseProjectId(projectId)
  const access = await requireProjectPermission(id, "view")
  const [listRows, memberRows] = await Promise.all([
    db.select().from(lists).where(eq(lists.projectId, id)).orderBy(asc(lists.position), asc(lists.createdAt)),
    db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, id))
      .orderBy(asc(users.name)),
  ])
  const taskRows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      position: tasks.position,
      listId: tasks.listId,
      assigneeId: users.id,
      assigneeName: users.name,
      assigneeEmail: users.email,
    })
    .from(tasks)
    .innerJoin(lists, eq(tasks.listId, lists.id))
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(eq(lists.projectId, id))
    .orderBy(asc(tasks.position), asc(tasks.createdAt))

  const tasksByList = new Map<string, BoardTask[]>()
  for (const task of taskRows) {
    const current = tasksByList.get(task.listId) ?? []
    current.push({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      position: task.position,
      assignee: task.assigneeId
        ? { id: task.assigneeId, name: task.assigneeName ?? "Unknown", email: task.assigneeEmail ?? "" }
        : null,
    })
    tasksByList.set(task.listId, current)
  }

  return {
    role: access.role,
    members: memberRows,
    lists: listRows.map((list) => ({ ...list, tasks: tasksByList.get(list.id) ?? [] })),
  }
}

export async function getTaskForProject(projectId: string, taskId: string) {
  const id = parseProjectId(projectId)
  const parsedTaskId = parseTaskId(taskId)
  await requireProjectPermission(id, "view")
  const [task] = await db
    .select()
    .from(tasks)
    .innerJoin(lists, eq(tasks.listId, lists.id))
    .where(and(eq(tasks.id, parsedTaskId), eq(lists.projectId, id)))
    .limit(1)
  if (!task) throw new ProjectAccessError("Task not found", 404)
  return task
}

export async function createList(projectId: string, input: unknown) {
  const id = parseProjectId(projectId)
  const values = listSchema.parse({ ...(input as object), projectId: id })
  const currentUser = await getCurrentDatabaseUser()
  const rows = await executeProjectLockedWrite<{ id: string }>(
    id,
    sql`
    WITH "authorized_project" AS (
      SELECT ${id}::uuid AS "id"
      WHERE ${canManage(id, currentUser.id)}
    )
    INSERT INTO "lists" ("name", "project_id", "position")
    SELECT ${values.name}, "authorized_project"."id",
      COALESCE((SELECT MAX("position") + 1 FROM "lists" WHERE "project_id" = ${id}), 0)
    FROM "authorized_project"
    RETURNING "id"
  `,
  )
  if (!rows[0]) throw new ProjectAccessError("Project not found or you cannot manage its lists", 404)
  return rows[0]
}

export async function renameList(projectId: string, listId: string, input: unknown) {
  const id = parseProjectId(projectId)
  const parsedListId = parseListId(listId)
  const values = updateListSchema.parse(input)
  if (!values.name) throw new ProjectAccessError("A list name is required", 422)
  const currentUser = await getCurrentDatabaseUser()
  const { rows } = await db.execute<{ id: string }>(sql`
    UPDATE "lists" AS "list"
    SET "name" = ${values.name}, "updated_at" = NOW()
    WHERE "list"."id" = ${parsedListId}
      AND "list"."project_id" = ${id}
      AND ${canManage(id, currentUser.id)}
    RETURNING "list"."id" AS "id"
  `)
  if (!rows[0]) throw new ProjectAccessError("List not found or you cannot manage it", 404)
}

export async function deleteList(projectId: string, listId: string) {
  const id = parseProjectId(projectId)
  const parsedListId = parseListId(listId)
  const currentUser = await getCurrentDatabaseUser()
  const rows = await executeProjectLockedWrite<{ id: string }>(
    id,
    sql`
    WITH "deleted" AS (
      DELETE FROM "lists" AS "list"
      WHERE "list"."id" = ${parsedListId}
        AND "list"."project_id" = ${id}
        AND ${canManage(id, currentUser.id)}
      RETURNING "list"."id", "list"."position"
    ), "compacted" AS (
      UPDATE "lists" AS "list"
      SET "position" = "list"."position" - 1, "updated_at" = NOW()
      WHERE "list"."project_id" = ${id}
        AND "list"."position" > (SELECT "position" FROM "deleted")
      RETURNING "list"."id"
    )
    SELECT "id" FROM "deleted"
  `,
  )
  if (!rows[0]) throw new ProjectAccessError("List not found or you cannot manage it", 404)
}

export async function reorderLists(projectId: string, input: unknown) {
  const id = parseProjectId(projectId)
  const { listIds } = reorderListsSchema.parse(input)
  const currentUser = await getCurrentDatabaseUser()
  const rows = await executeProjectLockedWrite<{ count: number }>(
    id,
    sql`
    WITH "ordered" AS (${orderedUuids(listIds)}), "updated" AS (
      UPDATE "lists" AS "list"
      SET "position" = "ordered"."position", "updated_at" = NOW()
      FROM "ordered"
      WHERE "list"."id" = "ordered"."id"
        AND "list"."project_id" = ${id}
        AND ${canManage(id, currentUser.id)}
        AND (SELECT COUNT(*) FROM "lists" WHERE "project_id" = ${id}) = ${listIds.length}
        AND (
          SELECT COUNT(*)
          FROM "ordered"
          INNER JOIN "lists" AS "ordered_list" ON "ordered_list"."id" = "ordered"."id"
          WHERE "ordered_list"."project_id" = ${id}
        ) = ${listIds.length}
      RETURNING "list"."id"
    )
    SELECT COUNT(*)::integer AS "count" FROM "updated"
  `,
  )
  if (rows[0]?.count !== listIds.length) throw new ProjectAccessError("Lists changed or you cannot reorder them", 409)
}

export async function createTask(projectId: string, input: unknown) {
  const id = parseProjectId(projectId)
  const values = taskSchema.parse(input)
  const currentUser = await getCurrentDatabaseUser()
  const rows = await executeProjectLockedWrite<{ id: string }>(
    id,
    sql`
    WITH "authorized_list" AS (
      SELECT "list"."id"
      FROM "lists" AS "list"
      WHERE "list"."id" = ${values.listId}
        AND "list"."project_id" = ${id}
        AND ${canWorkOnTasks(id, currentUser.id)}
        AND ${isValidAssignee(id, values.assigneeId)}
    )
    INSERT INTO "tasks" ("title", "description", "list_id", "assignee_id", "priority", "due_date", "position")
    SELECT ${values.title}, ${values.description ?? null}, "authorized_list"."id", ${values.assigneeId ?? null},
      ${values.priority}, ${values.dueDate ?? null},
      COALESCE((SELECT MAX("position") + 1 FROM "tasks" WHERE "list_id" = "authorized_list"."id"), 0)
    FROM "authorized_list"
    RETURNING "id"
  `,
  )
  if (!rows[0])
    throw new ProjectAccessError("List not found, assignee is not a member, or you cannot create tasks", 404)
  return rows[0]
}

export async function updateTask(projectId: string, taskId: string, input: unknown) {
  const id = parseProjectId(projectId)
  const parsedTaskId = parseTaskId(taskId)
  const values = updateTaskSchema.parse(input)
  const currentUser = await getCurrentDatabaseUser()
  const assignments = [
    values.title === undefined ? null : sql`"title" = ${values.title}`,
    values.description === undefined ? null : sql`"description" = ${values.description}`,
    values.assigneeId === undefined ? null : sql`"assignee_id" = ${values.assigneeId}`,
    values.priority === undefined ? null : sql`"priority" = ${values.priority}`,
    values.dueDate === undefined ? null : sql`"due_date" = ${values.dueDate}`,
    sql`"updated_at" = NOW()`,
  ].filter((assignment): assignment is ReturnType<typeof sql> => assignment !== null)
  const rows = await executeProjectLockedWrite<{ id: string }>(
    id,
    sql`
    UPDATE "tasks" AS "task"
    SET ${sql.join(assignments, sql`, `)}
    WHERE "task"."id" = ${parsedTaskId}
      AND EXISTS (SELECT 1 FROM "lists" WHERE "id" = "task"."list_id" AND "project_id" = ${id})
      AND ${canWorkOnTasks(id, currentUser.id)}
      AND ${isValidAssignee(id, values.assigneeId)}
    RETURNING "task"."id" AS "id"
  `,
  )
  if (!rows[0]) throw new ProjectAccessError("Task not found, assignee is not a member, or you cannot edit it", 404)
}

export async function moveTask(projectId: string, taskId: string, input: unknown) {
  const id = parseProjectId(projectId)
  const parsedTaskId = parseTaskId(taskId)
  const { targetIndex, targetListId } = moveTaskSchema.parse(input)
  const targetId = parseListId(targetListId)
  const currentUser = await getCurrentDatabaseUser()
  const rows = await executeProjectLockedWrite<{ id: string }>(
    id,
    sql`
    WITH "authorized_task" AS (
      SELECT "task"."id", "task"."list_id" AS "source_list_id", "task"."position" AS "source_position"
      FROM "tasks" AS "task"
      INNER JOIN "lists" AS "source_list" ON "source_list"."id" = "task"."list_id"
      INNER JOIN "lists" AS "target_list" ON "target_list"."id" = ${targetId}
      WHERE "task"."id" = ${parsedTaskId}
        AND "source_list"."project_id" = ${id}
        AND "target_list"."project_id" = ${id}
        AND "source_list"."id" <> "target_list"."id"
        AND ${canWorkOnTasks(id, currentUser.id)}
    ), "destination" AS (
      SELECT COUNT(*)::integer AS "task_count"
      FROM "tasks"
      WHERE "list_id" = ${targetId}
    ), "valid_move" AS (
      SELECT "authorized_task".*,
        COALESCE(${targetIndex ?? null}::integer, "destination"."task_count") AS "target_position"
      FROM "authorized_task"
      CROSS JOIN "destination"
      WHERE COALESCE(${targetIndex ?? null}::integer, "destination"."task_count")
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
      WHERE "task"."list_id" = ${targetId}
        AND "task"."position" >= (SELECT "target_position" FROM "valid_move")
      RETURNING "task"."id"
    ), "moved" AS (
      UPDATE "tasks" AS "task"
      SET "list_id" = ${targetId},
          "position" = (SELECT "target_position" FROM "valid_move"),
          "updated_at" = NOW()
      WHERE "task"."id" = (SELECT "id" FROM "valid_move")
      RETURNING "task"."id"
    )
    SELECT "id" FROM "moved"
  `,
  )
  if (!rows[0])
    throw new ProjectAccessError("Task, destination list, or target position is invalid, or you cannot move it", 409)
}

export async function deleteTask(projectId: string, taskId: string) {
  const id = parseProjectId(projectId)
  const parsedTaskId = parseTaskId(taskId)
  const currentUser = await getCurrentDatabaseUser()
  const rows = await executeProjectLockedWrite<{ id: string }>(
    id,
    sql`
    WITH "deleted" AS (
      DELETE FROM "tasks" AS "task"
      USING "lists" AS "list"
      WHERE "task"."id" = ${parsedTaskId}
        AND "list"."id" = "task"."list_id"
        AND "list"."project_id" = ${id}
        AND ${canManage(id, currentUser.id)}
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
  if (!rows[0]) throw new ProjectAccessError("Task not found or you cannot delete it", 404)
}

export async function reorderTasks(projectId: string, listId: string, input: unknown) {
  const id = parseProjectId(projectId)
  const parsedListId = parseListId(listId)
  const { taskIds } = reorderTasksSchema.parse(input)
  const currentUser = await getCurrentDatabaseUser()
  const rows = await executeProjectLockedWrite<{ count: number }>(
    id,
    sql`
    WITH "ordered" AS (${orderedUuids(taskIds)}), "updated" AS (
      UPDATE "tasks" AS "task"
      SET "position" = "ordered"."position", "updated_at" = NOW()
      FROM "ordered"
      WHERE "task"."id" = "ordered"."id"
        AND "task"."list_id" = ${parsedListId}
        AND EXISTS (SELECT 1 FROM "lists" WHERE "id" = ${parsedListId} AND "project_id" = ${id})
        AND ${canWorkOnTasks(id, currentUser.id)}
        AND (SELECT COUNT(*) FROM "tasks" WHERE "list_id" = ${parsedListId}) = ${taskIds.length}
        AND (
          SELECT COUNT(*)
          FROM "ordered"
          INNER JOIN "tasks" AS "ordered_task" ON "ordered_task"."id" = "ordered"."id"
          WHERE "ordered_task"."list_id" = ${parsedListId}
        ) = ${taskIds.length}
      RETURNING "task"."id"
    )
    SELECT COUNT(*)::integer AS "count" FROM "updated"
  `,
  )
  if (rows[0]?.count !== taskIds.length) throw new ProjectAccessError("Tasks changed or you cannot reorder them", 409)
}
