"use server"

import { invitationActionError, refreshInvitationPaths } from "@/features/invitations/actions/invitation-action-support"
import { createProjectInvitation } from "@/features/invitations/services/invitation.service"
import type { ActionState } from "@/lib/action-state"
import { actionSuccess } from "@/lib/action-state"

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
    return invitationActionError(error)
  }
}
