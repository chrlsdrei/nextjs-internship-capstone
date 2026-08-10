export type TaskCommentPermissionsDto = {
  canEdit: boolean
  canDelete: boolean
  canModerate: boolean
}

export type TaskCommentDto = {
  id: string
  projectId: string
  taskId: string
  content: string | null
  author: {
    workspaceMemberId: string | null
    name: string
    email: string
    removed: boolean
  }
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  permissions: TaskCommentPermissionsDto
}

export type TaskCommentCursorDto = { createdAt: string; id: string }

export type TaskCommentPageDto = {
  items: TaskCommentDto[]
  nextCursor: TaskCommentCursorDto | null
}

export type CreateTaskCommentCommand = { projectId: string; taskId: string; content: string }
export type UpdateTaskCommentCommand = CreateTaskCommentCommand & { commentId: string }
export type DeleteTaskCommentCommand = { projectId: string; taskId: string; commentId: string }
