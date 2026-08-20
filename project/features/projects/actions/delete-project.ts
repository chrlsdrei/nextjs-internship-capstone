"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { publishProjectEvent } from "@/features/board/services/project-event.service"
import { projectActionError } from "@/features/projects/actions/project-action-support"
import { deleteProject } from "@/features/projects/services/project.service"
import type { ActionState } from "@/lib/action-state"

export async function deleteProjectAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const projectId = String(formData.get("projectId") ?? "")
    await deleteProject(projectId)
    publishProjectEvent(projectId, "project.deleted")
    revalidatePath("/projects")
    revalidatePath("/dashboard")
  } catch (error) {
    return projectActionError(error)
  }

  redirect("/projects")
}
