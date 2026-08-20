import { revalidatePath } from "next/cache"
import { ZodError } from "zod"

import { BillingError } from "@/features/billing/billing.error"
import { publishProjectEvent } from "@/features/board/services/project-event.service"
import { ProjectAccessError } from "@/features/projects/project.error"
import { RateLimitError } from "@/features/rate-limits/rate-limit.error"
import type { ActionState } from "@/lib/action-state"
import { actionError, actionSuccess } from "@/lib/action-state"

function boardActionError(error: unknown): ActionState {
  if (error instanceof BillingError) return actionError(error.message, undefined, { code: error.code })
  if (error instanceof RateLimitError) {
    return actionError(error.message, undefined, { code: error.code, retryAfterSeconds: error.retryAfterSeconds })
  }
  if (error instanceof ProjectAccessError) return actionError(error.message)
  if (error instanceof ZodError) return actionError(error.issues[0]?.message ?? "Please check the form")
  console.error("Board action failed", error)
  return actionError("Something went wrong. Please try again.")
}

export function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "")
}

export function optionalJson(formData: FormData, key: string) {
  return formData.has(key) ? (JSON.parse(formValue(formData, key)) as unknown) : undefined
}

export async function runBoardAction(projectId: string, callback: () => Promise<unknown>): Promise<ActionState> {
  try {
    await callback()
    publishProjectEvent(projectId, "board.updated")
    revalidatePath(`/projects/${projectId}`)
    revalidatePath("/projects")
    revalidatePath("/dashboard")
    return actionSuccess(undefined, "Saved.")
  } catch (error) {
    return boardActionError(error)
  }
}
