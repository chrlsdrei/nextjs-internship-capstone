import { revalidatePath } from "next/cache"
import { ZodError } from "zod"

import { publishProjectEvent } from "@/features/board/services/project-event.service"
import { LabelError } from "@/features/labels/label.error"
import { ProjectAccessError } from "@/features/projects/project.error"
import { RateLimitError } from "@/features/rate-limits/rate-limit.error"
import type { ActionState } from "@/lib/action-state"
import { actionError, actionSuccess } from "@/lib/action-state"

export function labelActionError(error: unknown): ActionState {
  if (error instanceof RateLimitError) {
    return actionError(error.message, undefined, { code: error.code, retryAfterSeconds: error.retryAfterSeconds })
  }
  if (error instanceof LabelError) return actionError(error.message, undefined, { code: error.code })
  if (error instanceof ProjectAccessError) return actionError(error.message)
  if (error instanceof ZodError) return actionError(error.issues[0]?.message ?? "Please check the label values")
  console.error("Label action failed", error)
  return actionError("Something went wrong. Please try again.")
}

export function completeLabelAction(projectId: string, message: string): ActionState {
  publishProjectEvent(projectId, "board.updated")
  revalidatePath(`/projects/${projectId}`)
  return actionSuccess(undefined, message)
}
