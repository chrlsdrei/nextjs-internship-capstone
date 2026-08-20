"use server"

import { runCommentAction } from "@/features/comments/actions/comment-action-support"
import type { CreateTaskCommentCommand } from "@/features/comments/comment.types"
import { createTaskComment } from "@/features/comments/services/comment.service"

export async function createTaskCommentAction(command: CreateTaskCommentCommand) {
  return runCommentAction(command.projectId, () => createTaskComment(command), "Comment added.")
}
