"use server"

import { invitationActionError, refreshInvitationPaths } from "@/features/invitations/actions/invitation-action-support"
import type { InvitationAcceptanceDto } from "@/features/invitations/invitation.types"
import { acceptInvitation } from "@/features/invitations/services/invitation.service"
import type { ActionState } from "@/lib/action-state"
import { actionSuccess } from "@/lib/action-state"

export async function acceptInvitationAction(
  _: ActionState<InvitationAcceptanceDto>,
  formData: FormData,
): Promise<ActionState<InvitationAcceptanceDto>> {
  try {
    const accepted = await acceptInvitation({ token: formData.get("token") })
    refreshInvitationPaths(accepted.workspaceId, accepted.projectId)
    return actionSuccess(accepted, "Invitation accepted.")
  } catch (error) {
    return invitationActionError<InvitationAcceptanceDto>(error)
  }
}
