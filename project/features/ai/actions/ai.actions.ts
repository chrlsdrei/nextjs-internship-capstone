"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { generateBoard, generateBoardSummary, generateTasks } from "@/features/ai/server/ai-generation.service"
import { BillingError } from "@/features/billing/billing.error"
import { RateLimitError } from "@/features/rate-limits/rate-limit.error"
import { type ActionState, actionError, actionSuccess } from "@/lib/action-state"

function failure(error: unknown): ActionState {
  if (error instanceof z.ZodError) return actionError("Check the highlighted fields", error.flatten().fieldErrors)
  if (error instanceof BillingError) return actionError(error.message, undefined, { code: error.code })
  if (error instanceof RateLimitError) {
    return actionError(error.message, undefined, { code: error.code, retryAfterSeconds: error.retryAfterSeconds })
  }
  console.error("AI action failed", error)
  return actionError(error instanceof Error ? error.message : "AI generation failed")
}

export async function generateBoardAction(input: unknown): Promise<ActionState<{ projectId: string }>> {
  try {
    const result = await generateBoard(input)
    revalidatePath("/dashboard")
    revalidatePath("/projects")
    return actionSuccess({ projectId: result.projectId }, result.duplicate ? "Board already created" : "Board created")
  } catch (error) {
    return failure(error)
  }
}

export async function generateTasksAction(input: unknown): Promise<ActionState<{ created: number }>> {
  try {
    const result = await generateTasks(input)
    const projectId = typeof input === "object" && input && "projectId" in input ? String(input.projectId) : ""
    revalidatePath(`/projects/${projectId}`)
    return actionSuccess({ created: result.created }, `${result.created} tasks created`)
  } catch (error) {
    return failure(error)
  }
}

export async function generateBoardSummaryAction(input: unknown) {
  try {
    const summary = await generateBoardSummary(input)
    return actionSuccess(summary, "Board summary created")
  } catch (error) {
    return failure(error)
  }
}
