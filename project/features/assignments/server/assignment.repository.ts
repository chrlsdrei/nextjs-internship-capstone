import "server-only"

import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm"

import {
  canAssignTasks,
  canWorkOnTasks,
  executeLockedBoardWrite,
} from "@/features/board/server/board.repository-helpers"
import { db } from "@/server/db/client"
import { projectMembers, taskAssignees, tasks, users, workspaceMembers } from "@/server/db/schema"

function requestedAssignees(projectId: string, projectMemberIds: string[]) {
  const ids = JSON.stringify(projectMemberIds)
  return sql`
    SELECT "input"."id"
    FROM (
      SELECT DISTINCT "value"::uuid AS "id"
      FROM jsonb_array_elements_text(${ids}::jsonb)
    ) AS "input"
    INNER JOIN "project_members" AS "project_member"
      ON "project_member"."id" = "input"."id"
      AND "project_member"."project_id" = ${projectId}
      AND "project_member"."removed_at" IS NULL
    INNER JOIN "workspace_members" AS "workspace_member"
      ON "workspace_member"."id" = "project_member"."workspace_member_id"
      AND "workspace_member"."removed_at" IS NULL
  `
}

export async function replaceTaskAssignees(
  projectId: string,
  actorUserId: string,
  taskId: string,
  projectMemberIds: string[],
) {
  const requestedCount = new Set(projectMemberIds).size
  const rows = await executeLockedBoardWrite<{ id: string }>(
    projectId,
    sql`
      WITH "requested" AS (${requestedAssignees(projectId, projectMemberIds)}),
      "actor" AS (
        SELECT "workspace_member"."id"
        FROM "projects" AS "project"
        INNER JOIN "workspace_members" AS "workspace_member"
          ON "workspace_member"."workspace_id" = "project"."workspace_id"
          AND "workspace_member"."user_id" = ${actorUserId}
          AND "workspace_member"."removed_at" IS NULL
        WHERE "project"."id" = ${projectId}
      ), "authorized_task" AS (
        SELECT "task"."id"
        FROM "tasks" AS "task"
        WHERE "task"."id" = ${taskId}
          AND "task"."project_id" = ${projectId}
          AND ${canWorkOnTasks(projectId, actorUserId)}
          AND ${canAssignTasks(projectId, actorUserId)}
          AND (SELECT COUNT(*) FROM "requested") = ${requestedCount}
      ), "deleted" AS (
        DELETE FROM "task_assignees" AS "assignment"
        WHERE "assignment"."task_id" = (SELECT "id" FROM "authorized_task")
          AND "assignment"."project_id" = ${projectId}
          AND NOT EXISTS (
            SELECT 1 FROM "requested" WHERE "requested"."id" = "assignment"."project_member_id"
          )
        RETURNING "assignment"."project_member_id"
      ), "inserted" AS (
        INSERT INTO "task_assignees" (
          "project_id", "task_id", "project_member_id", "assigned_by_workspace_member_id"
        )
        SELECT ${projectId}, "authorized_task"."id", "requested"."id", "actor"."id"
        FROM "authorized_task"
        CROSS JOIN "requested"
        CROSS JOIN "actor"
        ON CONFLICT ("task_id", "project_member_id") DO NOTHING
        RETURNING "project_member_id"
      )
      SELECT "id" FROM "authorized_task"
    `,
  )
  return rows[0] ?? null
}

export async function addTaskAssigneeRecord(
  projectId: string,
  actorUserId: string,
  taskId: string,
  projectMemberId: string,
) {
  const rows = await executeLockedBoardWrite<{ id: string }>(
    projectId,
    sql`
      WITH "requested" AS (${requestedAssignees(projectId, [projectMemberId])}),
      "actor" AS (
        SELECT "workspace_member"."id"
        FROM "projects" AS "project"
        INNER JOIN "workspace_members" AS "workspace_member"
          ON "workspace_member"."workspace_id" = "project"."workspace_id"
          AND "workspace_member"."user_id" = ${actorUserId}
          AND "workspace_member"."removed_at" IS NULL
        WHERE "project"."id" = ${projectId}
      ), "authorized_task" AS (
        SELECT "task"."id"
        FROM "tasks" AS "task"
        WHERE "task"."id" = ${taskId}
          AND "task"."project_id" = ${projectId}
          AND ${canWorkOnTasks(projectId, actorUserId)}
          AND ${canAssignTasks(projectId, actorUserId)}
          AND (SELECT COUNT(*) FROM "requested") = 1
      ), "inserted" AS (
        INSERT INTO "task_assignees" (
          "project_id", "task_id", "project_member_id", "assigned_by_workspace_member_id"
        )
        SELECT ${projectId}, "authorized_task"."id", "requested"."id", "actor"."id"
        FROM "authorized_task"
        CROSS JOIN "requested"
        CROSS JOIN "actor"
        ON CONFLICT ("task_id", "project_member_id") DO NOTHING
        RETURNING "project_member_id"
      )
      SELECT "id" FROM "authorized_task"
    `,
  )
  return rows[0] ?? null
}

export async function removeTaskAssigneeRecord(
  projectId: string,
  actorUserId: string,
  taskId: string,
  projectMemberId: string,
) {
  const rows = await executeLockedBoardWrite<{ id: string }>(
    projectId,
    sql`
      WITH "authorized_task" AS (
        SELECT "task"."id"
        FROM "tasks" AS "task"
        WHERE "task"."id" = ${taskId}
          AND "task"."project_id" = ${projectId}
          AND ${canWorkOnTasks(projectId, actorUserId)}
          AND ${canAssignTasks(projectId, actorUserId)}
      ), "deleted" AS (
        DELETE FROM "task_assignees" AS "assignment"
        WHERE "assignment"."task_id" = (SELECT "id" FROM "authorized_task")
          AND "assignment"."project_id" = ${projectId}
          AND "assignment"."project_member_id" = ${projectMemberId}
        RETURNING "assignment"."project_member_id"
      )
      SELECT "id" FROM "authorized_task"
    `,
  )
  return rows[0] ?? null
}

export async function findTaskAssignmentContexts(projectId: string, taskIds: string[]) {
  if (taskIds.length === 0) return []
  const [taskRows, assignmentRows] = await Promise.all([
    db
      .select({ id: tasks.id, title: tasks.title })
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), inArray(tasks.id, taskIds))),
    db
      .select({
        taskId: taskAssignees.taskId,
        id: projectMembers.id,
        userId: users.id,
        workspaceMemberId: workspaceMembers.id,
        name: users.name,
        email: users.email,
      })
      .from(taskAssignees)
      .innerJoin(projectMembers, eq(taskAssignees.projectMemberId, projectMembers.id))
      .innerJoin(workspaceMembers, eq(projectMembers.workspaceMemberId, workspaceMembers.id))
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(
        and(
          eq(taskAssignees.projectId, projectId),
          inArray(taskAssignees.taskId, taskIds),
          isNull(projectMembers.removedAt),
          isNull(workspaceMembers.removedAt),
        ),
      )
      .orderBy(asc(taskAssignees.assignedAt), asc(projectMembers.id)),
  ])

  return taskRows.map((task) => ({
    ...task,
    assignees: assignmentRows.filter((assignment) => assignment.taskId === task.id),
  }))
}

export async function findTaskAssignmentContext(projectId: string, taskId: string) {
  return (await findTaskAssignmentContexts(projectId, [taskId]))[0] ?? null
}
