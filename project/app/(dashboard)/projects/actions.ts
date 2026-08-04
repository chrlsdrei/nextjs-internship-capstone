"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { ZodError } from "zod"

import {
  addProjectMember,
  createProject,
  deleteProject,
  removeProjectMember,
  transferProjectOwnership,
  updateProject,
  updateProjectMemberRole,
} from "@/lib/db/queries/projects"
import { ProjectAccessError } from "@/lib/project-access"
import { publishProjectEvent } from "@/lib/project-events"

export type ProjectActionState = { success: boolean; error?: string }

export const initialProjectActionState: ProjectActionState = { success: false }

function getErrorMessage(error: unknown) {
  if (error instanceof ProjectAccessError) {
    return error.message
  }
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Please check the form and try again"
  }

  console.error("Project action failed", error)
  return "Something went wrong. Please try again."
}

function projectInput(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate"),
  }
}

export async function createProjectAction(_: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  try {
    const project = await createProject(projectInput(formData))
    publishProjectEvent(project.id, "project.updated")
    revalidatePath("/projects")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function updateProjectAction(_: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  try {
    const projectId = String(formData.get("projectId") ?? "")
    await updateProject(projectId, projectInput(formData))
    publishProjectEvent(projectId, "project.updated")
    revalidatePath("/projects")
    revalidatePath(`/projects/${projectId}/members`)
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function addProjectMemberAction(_: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  try {
    const projectId = String(formData.get("projectId") ?? "")
    await addProjectMember(projectId, { email: formData.get("email"), role: formData.get("role") })
    publishProjectEvent(projectId, "members.updated")
    revalidatePath(`/projects/${projectId}/members`)
    revalidatePath("/projects")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function updateProjectMemberRoleAction(
  _: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  try {
    const projectId = String(formData.get("projectId") ?? "")
    await updateProjectMemberRole(projectId, String(formData.get("memberId") ?? ""), { role: formData.get("role") })
    publishProjectEvent(projectId, "members.updated")
    revalidatePath(`/projects/${projectId}/members`)
    revalidatePath("/projects")
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function removeProjectMemberAction(
  _: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  try {
    const projectId = String(formData.get("projectId") ?? "")
    await removeProjectMember(projectId, String(formData.get("memberId") ?? ""))
    publishProjectEvent(projectId, "members.updated")
    revalidatePath(`/projects/${projectId}/members`)
    revalidatePath("/projects")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function transferProjectOwnershipAction(
  _: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  try {
    const projectId = String(formData.get("projectId") ?? "")
    await transferProjectOwnership(projectId, { memberId: formData.get("memberId") })
    publishProjectEvent(projectId, "members.updated")
    revalidatePath(`/projects/${projectId}/members`)
    revalidatePath("/projects")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function deleteProjectAction(_: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  try {
    const projectId = String(formData.get("projectId") ?? "")
    await deleteProject(projectId)
    publishProjectEvent(projectId, "project.deleted")
    revalidatePath("/projects")
    revalidatePath("/dashboard")
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }

  redirect("/projects")
}
