import { ZodError } from "zod"

import { BillingError } from "@/features/billing/billing.error"
import { ProjectAccessError } from "@/features/projects/project.error"
import { RateLimitError } from "@/features/rate-limits/rate-limit.error"
import type { ActionState } from "@/lib/action-state"
import { actionError } from "@/lib/action-state"

export function projectActionError(error: unknown): ActionState {
  if (error instanceof BillingError) return actionError(error.message, undefined, { code: error.code })
  if (error instanceof RateLimitError) {
    return actionError(error.message, undefined, { code: error.code, retryAfterSeconds: error.retryAfterSeconds })
  }
  if (error instanceof ProjectAccessError) return actionError(error.message)
  if (error instanceof ZodError) return actionError(error.issues[0]?.message ?? "Please check the form and try again")
  console.error("Project action failed", error)
  return actionError("Something went wrong. Please try again.")
}

export function projectInput(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate"),
  }
}
