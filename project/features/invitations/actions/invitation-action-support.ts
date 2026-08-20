import { revalidatePath } from "next/cache"
import { ZodError } from "zod"

import { BillingError } from "@/features/billing/billing.error"
import { publishProjectEvent } from "@/features/board/services/project-event.service"
import { InvitationError } from "@/features/invitations/invitation.error"
import { RateLimitError } from "@/features/rate-limits/rate-limit.error"
import type { ActionState } from "@/lib/action-state"
import { actionError } from "@/lib/action-state"

export function invitationActionError<T = undefined>(error: unknown): ActionState<T> {
  if (error instanceof BillingError) return actionError(error.message, undefined, { code: error.code })
  if (error instanceof RateLimitError) {
    return actionError(error.message, undefined, { code: error.code, retryAfterSeconds: error.retryAfterSeconds })
  }
  if (error instanceof InvitationError) return actionError(error.message, undefined, { code: error.code })
  if (error instanceof ZodError) return actionError(error.issues[0]?.message ?? "Check the form and try again")
  console.error("Invitation action failed", error)
  return actionError("Something went wrong. Please try again.")
}

export function refreshInvitationPaths(workspaceId?: string, projectId?: string | null) {
  revalidatePath("/workspaces")
  revalidatePath("/projects")
  revalidatePath("/dashboard")
  if (workspaceId) revalidatePath(`/workspaces/${workspaceId}`)
  if (projectId) {
    publishProjectEvent(projectId, "activity.updated")
    revalidatePath(`/projects/${projectId}`)
  }
}
