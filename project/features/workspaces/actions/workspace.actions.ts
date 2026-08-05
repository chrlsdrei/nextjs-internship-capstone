"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"

import {
  createWorkspace,
  removeWorkspaceMember,
  transferWorkspaceOwnershipTo,
  updateWorkspaceDetails,
  updateWorkspaceMemberRole,
  updateWorkspaceSettings,
  WorkspaceAccessError,
} from "@/features/workspaces/server/workspace.service"
import type { ActionState } from "@/lib/action-state"
import { actionError, actionSuccess } from "@/lib/action-state"

function errorState<T = undefined>(error: unknown): ActionState<T> {
  if (error instanceof WorkspaceAccessError) return actionError(error.message)
  if (error instanceof ZodError) return actionError(error.issues[0]?.message ?? "Check the form and try again")
  console.error("Workspace action failed", error)
  return actionError("Something went wrong. Please try again.")
}

function refreshWorkspace(workspaceId?: string) {
  revalidatePath("/dashboard")
  revalidatePath("/projects")
  revalidatePath("/workspaces")
  if (workspaceId) revalidatePath(`/workspaces/${workspaceId}`)
}

export async function createWorkspaceAction(
  _: ActionState<{ workspaceId: string }>,
  formData: FormData,
): Promise<ActionState<{ workspaceId: string }>> {
  try {
    const workspace = await createWorkspace({
      name: formData.get("name"),
      description: formData.get("description"),
    })
    refreshWorkspace(workspace.id)
    return actionSuccess({ workspaceId: workspace.id }, "Workspace created.")
  } catch (error) {
    return errorState<{ workspaceId: string }>(error)
  }
}

export async function updateWorkspaceDetailsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const workspaceId = String(formData.get("workspaceId") ?? "")
  try {
    await updateWorkspaceDetails(workspaceId, {
      name: formData.get("name"),
      description: formData.get("description"),
    })
    refreshWorkspace(workspaceId)
    return actionSuccess(undefined, "Workspace details saved.")
  } catch (error) {
    return errorState(error)
  }
}

export async function updateWorkspaceSettingsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const workspaceId = String(formData.get("workspaceId") ?? "")
  try {
    await updateWorkspaceSettings(workspaceId, {
      membersCanCreateProjects: formData.get("membersCanCreateProjects") === "true",
    })
    refreshWorkspace(workspaceId)
    return actionSuccess(undefined, "Workspace settings saved.")
  } catch (error) {
    return errorState(error)
  }
}

export async function updateWorkspaceMemberRoleAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const workspaceId = String(formData.get("workspaceId") ?? "")
  try {
    await updateWorkspaceMemberRole(workspaceId, {
      memberId: formData.get("memberId"),
      role: formData.get("role"),
    })
    refreshWorkspace(workspaceId)
    return actionSuccess(undefined, "Member role updated.")
  } catch (error) {
    return errorState(error)
  }
}

export async function removeWorkspaceMemberAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const workspaceId = String(formData.get("workspaceId") ?? "")
  try {
    await removeWorkspaceMember(workspaceId, { memberId: formData.get("memberId") })
    refreshWorkspace(workspaceId)
    return actionSuccess(undefined, "Workspace member removed.")
  } catch (error) {
    return errorState(error)
  }
}

export async function transferWorkspaceOwnershipAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const workspaceId = String(formData.get("workspaceId") ?? "")
  try {
    await transferWorkspaceOwnershipTo(workspaceId, { newOwnerMemberId: formData.get("newOwnerMemberId") })
    refreshWorkspace(workspaceId)
    return actionSuccess(undefined, "Workspace ownership transferred.")
  } catch (error) {
    return errorState(error)
  }
}
