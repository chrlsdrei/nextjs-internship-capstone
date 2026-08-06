"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"

import { InvitationError } from "@/features/invitations/invitation.error"
import type { InvitationAcceptanceDto } from "@/features/invitations/invitation.types"
import {
  acceptInvitation,
  createProjectInvitation,
  createWorkspaceInvitation,
  resendInvitation,
  revokeInvitation,
} from "@/features/invitations/server/invitation.service"
import { RateLimitError } from "@/features/rate-limits/rate-limit.error"
import type { ActionState } from "@/lib/action-state"
import { actionError, actionSuccess } from "@/lib/action-state"

function errorState<T = undefined>(error: unknown): ActionState<T> {
  if (error instanceof RateLimitError) {
    return actionError(error.message, undefined, {
      code: error.code,
      retryAfterSeconds: error.retryAfterSeconds,
    })
  }
  if (error instanceof InvitationError) return actionError(error.message, undefined, { code: error.code })
  if (error instanceof ZodError) return actionError(error.issues[0]?.message ?? "Check the form and try again")
  console.error("Invitation action failed", error)
  return actionError("Something went wrong. Please try again.")
}

function refreshInvitationPaths(workspaceId?: string, projectId?: string | null) {
  revalidatePath("/workspaces")
  revalidatePath("/projects")
  revalidatePath("/dashboard")
  if (workspaceId) revalidatePath(`/workspaces/${workspaceId}`)
  if (projectId) revalidatePath(`/projects/${projectId}`)
}

export async function createWorkspaceInvitationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const invitation = await createWorkspaceInvitation({
      workspaceId: formData.get("workspaceId"),
      email: formData.get("email"),
      workspaceRole: formData.get("workspaceRole") || undefined,
      projectId: formData.get("projectId") || undefined,
      boardRole: formData.get("boardRole") || undefined,
    })
    refreshInvitationPaths(invitation.workspaceId, invitation.projectId)
    return actionSuccess(undefined, "Invitation sent.")
  } catch (error) {
    return errorState(error)
  }
}

export async function createProjectInvitationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const invitation = await createProjectInvitation({
      projectId: formData.get("projectId"),
      email: formData.get("email"),
      boardRole: formData.get("boardRole") || undefined,
    })
    refreshInvitationPaths(invitation.workspaceId, invitation.projectId)
    return actionSuccess(undefined, "Invitation sent.")
  } catch (error) {
    return errorState(error)
  }
}

export async function resendInvitationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const invitation = await resendInvitation(String(formData.get("invitationId") ?? ""))
    refreshInvitationPaths(invitation.workspaceId, invitation.projectId)
    return actionSuccess(undefined, "Invitation resent.")
  } catch (error) {
    return errorState(error)
  }
}

export async function revokeInvitationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const invitation = await revokeInvitation(String(formData.get("invitationId") ?? ""))
    refreshInvitationPaths(invitation.workspaceId, invitation.projectId)
    return actionSuccess(undefined, "Invitation revoked.")
  } catch (error) {
    return errorState(error)
  }
}

export async function acceptInvitationAction(
  _: ActionState<InvitationAcceptanceDto>,
  formData: FormData,
): Promise<ActionState<InvitationAcceptanceDto>> {
  try {
    const accepted = await acceptInvitation({ token: formData.get("token") })
    refreshInvitationPaths(accepted.workspaceId, accepted.projectId)
    return actionSuccess(accepted, "Invitation accepted.")
  } catch (error) {
    return errorState<InvitationAcceptanceDto>(error)
  }
}
