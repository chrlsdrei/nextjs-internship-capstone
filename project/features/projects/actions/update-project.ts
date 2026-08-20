"use server"

import { revalidatePath } from "next/cache"

import { publishProjectEvent } from "@/features/board/services/project-event.service"
import { projectActionError, projectInput } from "@/features/projects/actions/project-action-support"
import { updateProject } from "@/features/projects/services/project.service"
import type { ActionState } from "@/lib/action-state"
import { actionSuccess } from "@/lib/action-state"

export async function updateProjectAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const projectId = String(formData.get("projectId") ?? "")
    await updateProject(projectId, projectInput(formData))
    publishProjectEvent(projectId, "project.updated")
    revalidatePath("/projects")
    revalidatePath(`/projects/${projectId}/members`)
    revalidatePath("/dashboard")
    return actionSuccess(undefined, "Saved.")
  } catch (error) {
    return projectActionError(error)
  }
}
