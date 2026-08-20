import { revalidatePath } from "next/cache"
import { ZodError } from "zod"

import { publishProjectEvent } from "@/features/board/services/project-event.service"
import { ProjectAccessError } from "@/features/projects/project.error"
import { RateLimitError } from "@/features/rate-limits/rate-limit.error"
import type { ActionState } from "@/lib/action-state"
import { actionError } from "@/lib/action-state"

export function memberActionError(error: unknown): ActionState {
  if (error instanceof RateLimitError) {
    return actionError(error.message, undefined, { code: error.code, retryAfterSeconds: error.retryAfterSeconds })
  }
  if (error instanceof ProjectAccessError) return actionError(error.message)
  if (error instanceof ZodError) return actionError(error.issues[0]?.message ?? "Please check the form and try again")
  console.error("Member action failed", error)
  return actionError("Something went wrong. Please try again.")
}

export function refreshMembershipViews(projectId: string) {
  publishProjectEvent(projectId, "members.updated")
  revalidatePath(`/projects/${projectId}/members`)
  revalidatePath("/projects")
  revalidatePath("/dashboard")
}
