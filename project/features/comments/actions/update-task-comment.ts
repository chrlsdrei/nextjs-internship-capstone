"use server"

import { runCommentAction } from "@/features/comments/actions/comment-action-support"
import type { UpdateTaskCommentCommand } from "@/features/comments/comment.types"
import { updateTaskComment } from "@/features/comments/services/comment.service"

export async function updateTaskCommentAction(command: UpdateTaskCommentCommand) {
  return runCommentAction(command.projectId, () => updateTaskComment(command), "Comment updated.")
}
