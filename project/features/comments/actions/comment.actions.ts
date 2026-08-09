"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"

import { publishProjectEvent } from "@/features/board/server/project-event.service"
import { CommentError } from "@/features/comments/comment.error"
import type {
  CreateTaskCommentCommand,
  DeleteTaskCommentCommand,
  TaskCommentDto,
  TaskCommentPageDto,
  UpdateTaskCommentCommand,
} from "@/features/comments/comment.types"
import {
  createTaskComment,
  deleteTaskComment,
  listTaskComments,
  updateTaskComment,
} from "@/features/comments/server/comment.service"
import { ProjectAccessError } from "@/features/projects/server/project-access.service"
import { RateLimitError } from "@/features/rate-limits/rate-limit.error"
import type { ActionState } from "@/lib/action-state"
import { actionError, actionSuccess } from "@/lib/action-state"

function errorState<T>(error: unknown): ActionState<T> {
  if (error instanceof RateLimitError) {
    return actionError(error.message, undefined, { code: error.code, retryAfterSeconds: error.retryAfterSeconds })
  }
  if (error instanceof CommentError) return actionError(error.message, undefined, { code: error.code })
  if (error instanceof ProjectAccessError) return actionError(error.message)
  if (error instanceof ZodError) return actionError(error.issues[0]?.message ?? "Please check the comment")
  console.error("Comment action failed", error)
  return actionError("Something went wrong. Please try again.")
}

export async function listTaskCommentsAction(input: unknown): Promise<ActionState<TaskCommentPageDto>> {
  try {
    return actionSuccess(await listTaskComments(input))
  } catch (error) {
    return errorState(error)
  }
}

async function run(
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
    return errorState(error)
  }
}

export async function createTaskCommentAction(command: CreateTaskCommentCommand) {
  return run(command.projectId, () => createTaskComment(command), "Comment added.")
}

export async function updateTaskCommentAction(command: UpdateTaskCommentCommand) {
  return run(command.projectId, () => updateTaskComment(command), "Comment updated.")
}

export async function deleteTaskCommentAction(command: DeleteTaskCommentCommand) {
  return run(command.projectId, () => deleteTaskComment(command), "Comment deleted.")
}
