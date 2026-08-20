"use server"

import { invitationActionError, refreshInvitationPaths } from "@/features/invitations/actions/invitation-action-support"
import { createWorkspaceInvitation } from "@/features/invitations/services/invitation.service"
import type { ActionState } from "@/lib/action-state"
import { actionSuccess } from "@/lib/action-state"

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
    return invitationActionError(error)
  }
}
