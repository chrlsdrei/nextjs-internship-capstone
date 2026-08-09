import { commentCapabilities } from "@/features/comments/comment.policy"
import type { TaskCommentDto } from "@/features/comments/comment.types"
import type { BoardRole } from "@/features/projects/project.types"

export type TaskCommentRecordView = {
  id: string
  projectId: string
  taskId: string
  authorWorkspaceMemberId: string | null
  authorName: string
  authorEmail: string
  authorRemoved: boolean
  content: string
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export function toTaskCommentDto(
  record: TaskCommentRecordView,
  viewer: { role: BoardRole; workspaceMemberId: string },
): TaskCommentDto {
  const capabilities = commentCapabilities(
    viewer.role,
    viewer.workspaceMemberId,
    record.authorWorkspaceMemberId,
    record.deletedAt,
  )
  return {
    id: record.id,
    projectId: record.projectId,
    taskId: record.taskId,
    content: record.deletedAt ? null : record.content,
    author: {
      workspaceMemberId: record.authorWorkspaceMemberId,
      name: record.authorName,
      email: record.authorEmail,
      removed: record.authorRemoved,
    },
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    deletedAt: record.deletedAt?.toISOString() ?? null,
    permissions: {
      canEdit: capabilities.canEdit,
      canDelete: capabilities.canDelete,
      canModerate: capabilities.canModerate,
    },
  }
}
