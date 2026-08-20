"use server"

import { revalidatePath } from "next/cache"

import { publishProjectEvent } from "@/features/board/services/project-event.service"
import { projectActionError, projectInput } from "@/features/projects/actions/project-action-support"
import { createProject } from "@/features/projects/services/project.service"
import type { ActionState } from "@/lib/action-state"
import { actionSuccess } from "@/lib/action-state"

export async function createProjectAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const project = await createProject({ workspaceId: formData.get("workspaceId"), ...projectInput(formData) })
    publishProjectEvent(project.id, "project.updated")
    revalidatePath("/projects")
    revalidatePath("/dashboard")
    return actionSuccess(undefined, "Project created.")
  } catch (error) {
    return projectActionError(error)
  }
}
