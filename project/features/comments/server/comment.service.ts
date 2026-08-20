import "server-only"

import { recordActivity } from "@/features/activity/server/activity.service"
import { requireWorkspaceWritable } from "@/features/billing/server/entitlement.service"
import { CommentError } from "@/features/comments/comment.error"
import { toTaskCommentDto } from "@/features/comments/comment.mapper"
import { commentCapabilities } from "@/features/comments/comment.policy"
import {
  createTaskCommentSchema,
  deleteTaskCommentSchema,
  taskCommentPageSchema,
  updateTaskCommentSchema,
} from "@/features/comments/comment.schema"
import type { TaskCommentPageDto } from "@/features/comments/comment.types"
import {
  findTaskCommentContext,
  findTaskCommentRecord,
  insertTaskCommentRecord,
  listTaskCommentRecords,
  softDeleteTaskCommentRecord,
  updateTaskCommentRecord,
} from "@/features/comments/server/comment.repository"
import { publishTaskCommentNotifications } from "@/features/notifications/server/notification.service"
import { findProjectById } from "@/features/projects/server/project.repository"
import { ProjectAccessError, requireProjectPermission } from "@/features/projects/server/project-access.service"
import { enforceRateLimit } from "@/features/rate-limits/server/rate-limit.service"
import { findActiveWorkspaceAccess } from "@/features/workspaces/server/workspace.repository"

type CommentAccess = Awaited<ReturnType<typeof requireProjectPermission>>

function viewer(access: CommentAccess) {
  return { role: access.role, workspaceMemberId: access.workspaceMemberId }
}

async function enforceCommentWrite(access: CommentAccess) {
  await enforceRateLimit({ action: "comment.write", actorUserId: access.user.id, workspaceId: access.workspaceId })
}

async function recordCommentActivity(
  access: CommentAccess,
  context: { projectId: string; taskId: string; taskTitle: string },
  action: "task.comment_created" | "task.comment_updated" | "task.comment_deleted",
  author: { name: string; workspaceMemberId: string | null },
) {
  const [project, workspace] = await Promise.all([
    findProjectById(context.projectId),
    findActiveWorkspaceAccess(access.workspaceId, access.user.id),
  ])
  if (!project || !workspace) throw new ProjectAccessError("Comment activity context is unavailable", 409)
  await recordActivity({
    workspaceId: access.workspaceId,
    projectId: context.projectId,
    taskId: context.taskId,
    actorWorkspaceMemberId: access.workspaceMemberId,
    event: {
      action,
      metadata: {
        actorName: access.user.name,
        workspaceName: workspace.name,
        projectTitle: project.title,
        taskTitle: context.taskTitle,
        commentAuthorName: author.name,
        moderated: author.workspaceMemberId !== access.workspaceMemberId,
      },
    },
  })
}

export async function listTaskComments(input: unknown): Promise<TaskCommentPageDto> {
  const values = taskCommentPageSchema.parse(input)
  const access = await requireProjectPermission(values.projectId, "view")
  if (!(await findTaskCommentContext(values.projectId, values.taskId))) {
    throw new CommentError("Task not found", "TASK_NOT_FOUND", 404)
  }
  const records = await listTaskCommentRecords(values)
  const hasNextPage = records.length > values.limit
  const pageRecords = hasNextPage ? records.slice(0, values.limit) : records
  const last = pageRecords.at(-1)
  return {
    items: pageRecords.map((record) => toTaskCommentDto(record, viewer(access))),
    nextCursor: hasNextPage && last ? { createdAt: last.createdAt.toISOString(), id: last.id } : null,
  }
}

export async function createTaskComment(input: unknown) {
  const values = createTaskCommentSchema.parse(input)
  const access = await requireProjectPermission(values.projectId, "edit")
  await requireWorkspaceWritable(access.workspaceId, access.user.id)
  const context = await findTaskCommentContext(values.projectId, values.taskId)
  if (!context) throw new CommentError("Task not found", "TASK_NOT_FOUND", 404)
  await enforceCommentWrite(access)
  const inserted = await insertTaskCommentRecord({
    ...values,
    authorWorkspaceMemberId: access.workspaceMemberId,
    authorName: access.user.name,
    authorEmail: access.user.email,
  })
  if (!inserted) throw new CommentError("Task or active author membership was not found", "TASK_NOT_FOUND", 404)
  const comment = await findTaskCommentRecord(values.projectId, values.taskId, inserted.id)
  if (!comment) throw new CommentError("Comment was not found after creation", "COMMENT_NOT_FOUND", 409)
  await recordCommentActivity(access, context, "task.comment_created", {
    name: comment.authorName,
    workspaceMemberId: comment.authorWorkspaceMemberId,
  })
  await publishTaskCommentNotifications(comment.id)
  return toTaskCommentDto(comment, viewer(access))
}

export async function updateTaskComment(input: unknown) {
  const values = updateTaskCommentSchema.parse(input)
  const access = await requireProjectPermission(values.projectId, "edit")
  await requireWorkspaceWritable(access.workspaceId, access.user.id)
  const [context, current] = await Promise.all([
    findTaskCommentContext(values.projectId, values.taskId),
    findTaskCommentRecord(values.projectId, values.taskId, values.commentId),
  ])
  if (!context) throw new CommentError("Task not found", "TASK_NOT_FOUND", 404)
  if (!current) throw new CommentError("Comment not found", "COMMENT_NOT_FOUND", 404)
  if (current.deletedAt) throw new CommentError("Deleted comments cannot be edited", "COMMENT_DELETED", 409)
  const capabilities = commentCapabilities(
    access.role,
    access.workspaceMemberId,
    current.authorWorkspaceMemberId,
    current.deletedAt,
  )
  if (!capabilities.canEdit) throw new CommentError("You cannot edit this comment", "COMMENT_FORBIDDEN", 403)
  await enforceCommentWrite(access)
  const updated = await updateTaskCommentRecord({
    ...values,
    actorWorkspaceMemberId: access.workspaceMemberId,
    canMutateOwn: access.role === "board_admin" || access.role === "editor",
    canModerate: capabilities.canModerate,
  })
  if (!updated) throw new CommentError("Comment changed before it could be edited", "COMMENT_NOT_FOUND", 409)
  const comment = await findTaskCommentRecord(values.projectId, values.taskId, values.commentId)
  if (!comment) throw new CommentError("Comment not found", "COMMENT_NOT_FOUND", 404)
  await recordCommentActivity(access, context, "task.comment_updated", {
    name: comment.authorName,
    workspaceMemberId: comment.authorWorkspaceMemberId,
  })
  return toTaskCommentDto(comment, viewer(access))
}

export async function deleteTaskComment(input: unknown) {
  const values = deleteTaskCommentSchema.parse(input)
  const access = await requireProjectPermission(values.projectId, "edit")
  const [context, current] = await Promise.all([
    findTaskCommentContext(values.projectId, values.taskId),
    findTaskCommentRecord(values.projectId, values.taskId, values.commentId),
  ])
  if (!context) throw new CommentError("Task not found", "TASK_NOT_FOUND", 404)
  if (!current) throw new CommentError("Comment not found", "COMMENT_NOT_FOUND", 404)
  if (current.deletedAt) throw new CommentError("Comment is already deleted", "COMMENT_DELETED", 409)
  const capabilities = commentCapabilities(
    access.role,
    access.workspaceMemberId,
    current.authorWorkspaceMemberId,
    current.deletedAt,
  )
  if (!capabilities.canDelete) throw new CommentError("You cannot delete this comment", "COMMENT_FORBIDDEN", 403)
  await enforceCommentWrite(access)
  const deleted = await softDeleteTaskCommentRecord({
    ...values,
    actorWorkspaceMemberId: access.workspaceMemberId,
    canMutateOwn: access.role === "board_admin" || access.role === "editor",
    canModerate: capabilities.canModerate,
  })
  if (!deleted) throw new CommentError("Comment changed before it could be deleted", "COMMENT_NOT_FOUND", 409)
  await recordCommentActivity(access, context, "task.comment_deleted", {
    name: current.authorName,
    workspaceMemberId: current.authorWorkspaceMemberId,
  })
  const comment = await findTaskCommentRecord(values.projectId, values.taskId, values.commentId)
  if (!comment) throw new CommentError("Comment not found", "COMMENT_NOT_FOUND", 404)
  return toTaskCommentDto(comment, viewer(access))
}
