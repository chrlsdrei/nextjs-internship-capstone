"use server"

import { invitationActionError, refreshInvitationPaths } from "@/features/invitations/actions/invitation-action-support"
import { resendInvitation } from "@/features/invitations/services/invitation.service"
import type { ActionState } from "@/lib/action-state"
import { actionSuccess } from "@/lib/action-state"

export async function resendInvitationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const invitation = await resendInvitation(String(formData.get("invitationId") ?? ""))
    refreshInvitationPaths(invitation.workspaceId, invitation.projectId)
    return actionSuccess(undefined, "Invitation resent.")
  } catch (error) {
    return invitationActionError(error)
  }
}
