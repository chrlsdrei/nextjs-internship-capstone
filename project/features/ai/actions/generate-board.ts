"use server"

import { revalidatePath } from "next/cache"

import { aiActionFailure } from "@/features/ai/actions/ai-action-error"
import { generateBoard } from "@/features/ai/services/ai-generation.service"
import { type ActionState, actionSuccess } from "@/lib/action-state"

export async function generateBoardAction(input: unknown): Promise<ActionState<{ projectId: string }>> {
  try {
    const result = await generateBoard(input)
    revalidatePath("/dashboard")
    revalidatePath("/projects")
    return actionSuccess({ projectId: result.projectId }, result.duplicate ? "Board already created" : "Board created")
  } catch (error) {
    return aiActionFailure(error)
  }
}
