"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"
import { publishProjectEvent } from "@/features/board/server/project-event.service"
import {
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
} from "@/features/members/server/member.service"
import { ProjectAccessError } from "@/features/projects/server/project-access.service"
import type { ActionState } from "@/lib/action-state"
import { actionError, actionSuccess } from "@/lib/action-state"

function messageFor(error: unknown) {
  if (error instanceof ProjectAccessError) return error.message
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Please check the form and try again"
  console.error("Member action failed", error)
  return "Something went wrong. Please try again."
}

function refreshMembershipViews(projectId: string) {
  publishProjectEvent(projectId, "members.updated")
  revalidatePath(`/projects/${projectId}/members`)
  revalidatePath("/projects")
  revalidatePath("/dashboard")
}

export async function addProjectMemberAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const projectId = String(formData.get("projectId") ?? "")
    await addProjectMember(projectId, { email: formData.get("email"), role: formData.get("role") })
    refreshMembershipViews(projectId)
    return actionSuccess(undefined, "Member added.")
  } catch (error) {
    return actionError(messageFor(error))
  }
}

export async function updateProjectMemberRoleAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const projectId = String(formData.get("projectId") ?? "")
    await updateProjectMemberRole(projectId, String(formData.get("memberId") ?? ""), {
      role: formData.get("role"),
    })
    refreshMembershipViews(projectId)
    return actionSuccess(undefined, "Saved.")
  } catch (error) {
    return actionError(messageFor(error))
  }
}

export async function removeProjectMemberAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const projectId = String(formData.get("projectId") ?? "")
    await removeProjectMember(projectId, String(formData.get("memberId") ?? ""))
    refreshMembershipViews(projectId)
    return actionSuccess(undefined, "Member removed.")
  } catch (error) {
    return actionError(messageFor(error))
  }
}
