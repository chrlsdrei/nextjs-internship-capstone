import { revalidatePath } from "next/cache"
import { ZodError } from "zod"

import { publishProjectEvent } from "@/features/board/services/project-event.service"
import { CommentError } from "@/features/comments/comment.error"
import type { TaskCommentDto } from "@/features/comments/comment.types"
import { ProjectAccessError } from "@/features/projects/project.error"
import { RateLimitError } from "@/features/rate-limits/rate-limit.error"
import type { ActionState } from "@/lib/action-state"
import { actionError, actionSuccess } from "@/lib/action-state"

export function commentActionError<T>(error: unknown): ActionState<T> {
  if (error instanceof RateLimitError) {
    return actionError(error.message, undefined, { code: error.code, retryAfterSeconds: error.retryAfterSeconds })
  }
  if (error instanceof CommentError) return actionError(error.message, undefined, { code: error.code })
  if (error instanceof ProjectAccessError) return actionError(error.message)
  if (error instanceof ZodError) return actionError(error.issues[0]?.message ?? "Please check the comment")
  console.error("Comment action failed", error)
  return actionError("Something went wrong. Please try again.")
}

export async function runCommentAction(
  projectId: string,
  callback: () => Promise<TaskCommentDto>,
  message: string,
): Promise<ActionState<TaskCommentDto>> {
  try {
    const comment = await callback()
    publishProjectEvent(projectId, "board.updated")
    revalidatePath(`/projects/${projectId}`)
    return actionSuccess(comment, message)
  } catch (error) {
    return commentActionError(error)
  }
}
