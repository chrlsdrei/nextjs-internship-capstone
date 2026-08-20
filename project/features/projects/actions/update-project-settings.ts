"use server"

import { revalidatePath } from "next/cache"

import { publishProjectEvent } from "@/features/board/services/project-event.service"
import { projectActionError } from "@/features/projects/actions/project-action-support"
import { updateProjectSettings } from "@/features/projects/services/project.service"
import type { ActionState } from "@/lib/action-state"
import { actionSuccess } from "@/lib/action-state"

export async function updateProjectSettingsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const projectId = String(formData.get("projectId") ?? "")
    await updateProjectSettings(projectId, {
      editorsCanAssignTasks: formData.get("editorsCanAssignTasks") === "true",
    })
    publishProjectEvent(projectId, "project.updated")
    revalidatePath(`/projects/${projectId}`)
    revalidatePath(`/projects/${projectId}/members`)
    return actionSuccess(undefined, "Board rule saved.")
  } catch (error) {
    return projectActionError(error)
  }
}
