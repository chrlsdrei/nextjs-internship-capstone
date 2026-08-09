import "server-only"

import { and, desc, eq, isNull, lt, or, sql } from "drizzle-orm"

import type { TaskCommentPageInput } from "@/features/comments/comment.schema"
import { db } from "@/server/db/client"
import { projects, taskComments, tasks, workspaceMembers } from "@/server/db/schema"

export async function findTaskCommentContext(projectId: string, taskId: string) {
  const rows = await db
    .select({ taskId: tasks.id, taskTitle: tasks.title, projectId: projects.id, workspaceId: projects.workspaceId })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)))
    .limit(1)
  return rows[0] ?? null
}

const commentSelection = {
  id: taskComments.id,
  workspaceId: taskComments.workspaceId,
  projectId: taskComments.projectId,
  taskId: taskComments.taskId,
  authorWorkspaceMemberId: taskComments.authorWorkspaceMemberId,
  authorName: taskComments.authorName,
  authorEmail: taskComments.authorEmail,
  content: taskComments.content,
  deletedAt: taskComments.deletedAt,
  createdAt: taskComments.createdAt,
  updatedAt: taskComments.updatedAt,
  authorRemoved: sql<boolean>`${taskComments.authorWorkspaceMemberId} IS NULL OR ${workspaceMembers.removedAt} IS NOT NULL`,
}

export async function findTaskCommentRecord(projectId: string, taskId: string, commentId: string) {
  const rows = await db
    .select(commentSelection)
    .from(taskComments)
    .leftJoin(workspaceMembers, eq(taskComments.authorWorkspaceMemberId, workspaceMembers.id))
    .where(and(eq(taskComments.id, commentId), eq(taskComments.taskId, taskId), eq(taskComments.projectId, projectId)))
    .limit(1)
  return rows[0] ?? null
}

export async function listTaskCommentRecords(input: TaskCommentPageInput) {
  const cursorFilter = input.cursor
    ? or(
        lt(taskComments.createdAt, input.cursor.createdAt),
        and(eq(taskComments.createdAt, input.cursor.createdAt), lt(taskComments.id, input.cursor.id)),
      )
    : undefined
  return db
    .select(commentSelection)
    .from(taskComments)
    .leftJoin(workspaceMembers, eq(taskComments.authorWorkspaceMemberId, workspaceMembers.id))
    .where(and(eq(taskComments.projectId, input.projectId), eq(taskComments.taskId, input.taskId), cursorFilter))
    .orderBy(desc(taskComments.createdAt), desc(taskComments.id))
    .limit(input.limit + 1)
}

export async function insertTaskCommentRecord(input: {
  projectId: string
  taskId: string
  authorWorkspaceMemberId: string
  authorName: string
  authorEmail: string
  content: string
}) {
  const result = await db.execute<{ id: string }>(sql`
    INSERT INTO "task_comments" (
      "workspace_id", "project_id", "task_id", "author_workspace_member_id",
      "author_name", "author_email", "content"
    )
    SELECT "project"."workspace_id", "task"."project_id", "task"."id", "author"."id",
      ${input.authorName}, ${input.authorEmail}, ${input.content}
    FROM "tasks" AS "task"
    INNER JOIN "projects" AS "project" ON "project"."id" = "task"."project_id"
    INNER JOIN "workspace_members" AS "author"
      ON "author"."id" = ${input.authorWorkspaceMemberId}
      AND "author"."workspace_id" = "project"."workspace_id"
      AND "author"."removed_at" IS NULL
    WHERE "task"."id" = ${input.taskId}
      AND "task"."project_id" = ${input.projectId}
    RETURNING "id"
  `)
  return result.rows[0] ?? null
}

export async function updateTaskCommentRecord(input: {
  projectId: string
  taskId: string
  commentId: string
  actorWorkspaceMemberId: string
  canMutateOwn: boolean
  canModerate: boolean
  content: string
}) {
  const rows = await db
    .update(taskComments)
    .set({ content: input.content, updatedAt: new Date() })
    .where(
      and(
        eq(taskComments.id, input.commentId),
        eq(taskComments.projectId, input.projectId),
        eq(taskComments.taskId, input.taskId),
        isNull(taskComments.deletedAt),
        or(
          and(sql`${input.canMutateOwn}`, eq(taskComments.authorWorkspaceMemberId, input.actorWorkspaceMemberId)),
          sql`${input.canModerate}`,
        ),
      ),
    )
    .returning({ id: taskComments.id })
  return rows[0] ?? null
}

export async function softDeleteTaskCommentRecord(input: {
  projectId: string
  taskId: string
  commentId: string
  actorWorkspaceMemberId: string
  canMutateOwn: boolean
  canModerate: boolean
}) {
  const now = new Date()
  const rows = await db
    .update(taskComments)
    .set({ deletedAt: now, deletedByWorkspaceMemberId: input.actorWorkspaceMemberId, updatedAt: now })
    .where(
      and(
        eq(taskComments.id, input.commentId),
        eq(taskComments.projectId, input.projectId),
        eq(taskComments.taskId, input.taskId),
        isNull(taskComments.deletedAt),
        or(
          and(sql`${input.canMutateOwn}`, eq(taskComments.authorWorkspaceMemberId, input.actorWorkspaceMemberId)),
          sql`${input.canModerate}`,
        ),
      ),
    )
    .returning({ id: taskComments.id })
  return rows[0] ?? null
}
