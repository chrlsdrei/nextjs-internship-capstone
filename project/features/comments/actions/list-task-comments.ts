"use server"

import { commentActionError } from "@/features/comments/actions/comment-action-support"
import type { TaskCommentPageDto } from "@/features/comments/comment.types"
import { listTaskComments } from "@/features/comments/services/comment.service"
import type { ActionState } from "@/lib/action-state"
import { actionSuccess } from "@/lib/action-state"

export async function listTaskCommentsAction(input: unknown): Promise<ActionState<TaskCommentPageDto>> {
  try {
    return actionSuccess(await listTaskComments(input))
  } catch (error) {
    return commentActionError(error)
  }
}
