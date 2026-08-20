"use server"

import { runCommentAction } from "@/features/comments/actions/comment-action-support"
import type { DeleteTaskCommentCommand } from "@/features/comments/comment.types"
import { deleteTaskComment } from "@/features/comments/services/comment.service"

export async function deleteTaskCommentAction(command: DeleteTaskCommentCommand) {
  return runCommentAction(command.projectId, () => deleteTaskComment(command), "Comment deleted.")
}
