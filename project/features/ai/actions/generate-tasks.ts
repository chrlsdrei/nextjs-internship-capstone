"use server"

import { revalidatePath } from "next/cache"

import { aiActionFailure } from "@/features/ai/actions/ai-action-error"
import { generateTasks } from "@/features/ai/services/ai-generation.service"
import { type ActionState, actionSuccess } from "@/lib/action-state"

export async function generateTasksAction(input: unknown): Promise<ActionState<{ created: number }>> {
  try {
    const result = await generateTasks(input)
    const projectId = typeof input === "object" && input && "projectId" in input ? String(input.projectId) : ""
    revalidatePath(`/projects/${projectId}`)
    return actionSuccess({ created: result.created }, `${result.created} tasks created`)
  } catch (error) {
    return aiActionFailure(error)
  }
}
