"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { ZodError } from "zod"
import { publishProjectEvent } from "@/features/board/server/project-event.service"
import {
  createProject,
  deleteProject,
  updateProject,
  updateProjectSettings,
} from "@/features/projects/server/project.service"
import { ProjectAccessError } from "@/features/projects/server/project-access.service"
import { RateLimitError } from "@/features/rate-limits/rate-limit.error"
import type { ActionState } from "@/lib/action-state"
import { actionError, actionSuccess } from "@/lib/action-state"

function errorState(error: unknown): ActionState {
  if (error instanceof RateLimitError) {
    return actionError(error.message, undefined, {
      code: error.code,
      retryAfterSeconds: error.retryAfterSeconds,
    })
  }
  if (error instanceof ProjectAccessError) return actionError(error.message)
  if (error instanceof ZodError) return actionError(error.issues[0]?.message ?? "Please check the form and try again")
  console.error("Project action failed", error)
  return actionError("Something went wrong. Please try again.")
}

function createProjectInput(formData: FormData) {
  return {
    workspaceId: formData.get("workspaceId"),
    title: formData.get("title"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate"),
  }
}

function updateProjectInput(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate"),
  }
}

export async function createProjectAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const project = await createProject(createProjectInput(formData))
    publishProjectEvent(project.id, "project.updated")
    revalidatePath("/projects")
    revalidatePath("/dashboard")
    return actionSuccess(undefined, "Project created.")
  } catch (error) {
    return errorState(error)
  }
}

export async function updateProjectAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const projectId = String(formData.get("projectId") ?? "")
    await updateProject(projectId, updateProjectInput(formData))
    publishProjectEvent(projectId, "project.updated")
    revalidatePath("/projects")
    revalidatePath(`/projects/${projectId}/members`)
    revalidatePath("/dashboard")
    return actionSuccess(undefined, "Saved.")
  } catch (error) {
    return errorState(error)
  }
}

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
    return errorState(error)
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
    return errorState(error)
  }

  redirect("/projects")
}
