import { revalidatePath } from "next/cache"
import { ZodError } from "zod"

import { publishProjectEvent } from "@/features/board/services/project-event.service"
import { ProjectAccessError } from "@/features/projects/project.error"
import { RateLimitError } from "@/features/rate-limits/rate-limit.error"
import type { ActionState } from "@/lib/action-state"
import { actionError, actionSuccess } from "@/lib/action-state"

function assignmentActionError(error: unknown): ActionState {
  if (error instanceof RateLimitError) {
    return actionError(error.message, undefined, { code: error.code, retryAfterSeconds: error.retryAfterSeconds })
  }
  if (error instanceof ProjectAccessError) return actionError(error.message)
  if (error instanceof ZodError) return actionError(error.issues[0]?.message ?? "Please check the assignees")
  console.error("Task assignment action failed", error)
  return actionError("Something went wrong. Please try again.")
}

export async function runAssignmentAction(projectId: string, callback: () => Promise<void>): Promise<ActionState> {
  try {
    await callback()
    publishProjectEvent(projectId, "board.updated")
    revalidatePath(`/projects/${projectId}`)
    return actionSuccess(undefined, "Task assignees saved.")
  } catch (error) {
    return assignmentActionError(error)
  }
}
