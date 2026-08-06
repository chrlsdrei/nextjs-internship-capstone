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
  console.error("Member action failed", error)
  return actionError("Something went wrong. Please try again.")
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
    return errorState(error)
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
    return errorState(error)
  }
}

export async function removeProjectMemberAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const projectId = String(formData.get("projectId") ?? "")
    await removeProjectMember(projectId, String(formData.get("memberId") ?? ""))
    refreshMembershipViews(projectId)
    return actionSuccess(undefined, "Member removed.")
  } catch (error) {
    return errorState(error)
  }
}
