import { z } from "zod"

import { BillingError } from "@/features/billing/billing.error"
import { RateLimitError } from "@/features/rate-limits/rate-limit.error"
import { type ActionState, actionError } from "@/lib/action-state"

export function aiActionFailure(error: unknown): ActionState {
  if (error instanceof z.ZodError) return actionError("Check the highlighted fields", error.flatten().fieldErrors)
  if (error instanceof BillingError) return actionError(error.message, undefined, { code: error.code })
  if (error instanceof RateLimitError) {
    return actionError(error.message, undefined, { code: error.code, retryAfterSeconds: error.retryAfterSeconds })
  }
  console.error("AI action failed", error)
  return actionError(error instanceof Error ? error.message : "AI generation failed")
}
