"use server"

import { invitationActionError, refreshInvitationPaths } from "@/features/invitations/actions/invitation-action-support"
import { revokeInvitation } from "@/features/invitations/services/invitation.service"
import type { ActionState } from "@/lib/action-state"
import { actionSuccess } from "@/lib/action-state"

export async function revokeInvitationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const invitation = await revokeInvitation(String(formData.get("invitationId") ?? ""))
    refreshInvitationPaths(invitation.workspaceId, invitation.projectId)
    return actionSuccess(undefined, "Invitation revoked.")
  } catch (error) {
    return invitationActionError(error)
  }
}
