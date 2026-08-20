import { revalidatePath } from "next/cache"
import { ZodError } from "zod"

import { RateLimitError } from "@/features/rate-limits/rate-limit.error"
import { WorkspaceAccessError } from "@/features/workspaces/workspace.error"
import type { ActionState } from "@/lib/action-state"
import { actionError } from "@/lib/action-state"

export function workspaceActionError<T = undefined>(error: unknown): ActionState<T> {
  if (error instanceof RateLimitError) {
    return actionError(error.message, undefined, { code: error.code, retryAfterSeconds: error.retryAfterSeconds })
  }
  if (error instanceof WorkspaceAccessError) return actionError(error.message)
  if (error instanceof ZodError) return actionError(error.issues[0]?.message ?? "Check the form and try again")
  console.error("Workspace action failed", error)
  return actionError("Something went wrong. Please try again.")
}

export function refreshWorkspace(workspaceId?: string) {
  revalidatePath("/dashboard")
  revalidatePath("/projects")
  revalidatePath("/workspaces")
  if (workspaceId) revalidatePath(`/workspaces/${workspaceId}`)
}
