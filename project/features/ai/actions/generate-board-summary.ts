"use server"

import { aiActionFailure } from "@/features/ai/actions/ai-action-error"
import { generateBoardSummary } from "@/features/ai/services/ai-generation.service"
import { actionSuccess } from "@/lib/action-state"

export async function generateBoardSummaryAction(input: unknown) {
  try {
    const summary = await generateBoardSummary(input)
    return actionSuccess(summary, "Board summary created")
  } catch (error) {
    return aiActionFailure(error)
  }
}
