"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { ZodError } from "zod"
import { publishProjectEvent } from "@/features/board/server/project-event.service"
import { createProject, deleteProject, updateProject } from "@/features/projects/server/project.service"
import { ProjectAccessError } from "@/features/projects/server/project-access.service"
import type { ActionState } from "@/lib/action-state"
import { actionError, actionSuccess } from "@/lib/action-state"

function messageFor(error: unknown) {
  if (error instanceof ProjectAccessError) return error.message
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Please check the form and try again"
  console.error("Project action failed", error)
  return "Something went wrong. Please try again."
}

function projectInput(formData: FormData) {
  return {
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate"),
  }
}

export async function createProjectAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const project = await createProject(projectInput(formData))
    publishProjectEvent(project.id, "project.updated")
    revalidatePath("/projects")
    revalidatePath("/dashboard")
    return actionSuccess(undefined, "Project created.")
  } catch (error) {
    return actionError(messageFor(error))
  }
}

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
    return actionError(messageFor(error))
  }
}

export async function deleteProjectAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const projectId = String(formData.get("projectId") ?? "")
    await deleteProject(projectId)
    publishProjectEvent(projectId, "project.deleted")
    revalidatePath("/projects")
    revalidatePath("/dashboard")
  } catch (error) {
    return actionError(messageFor(error))
  }

  redirect("/projects")
}
