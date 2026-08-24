"use server"

import { invitationActionError, refreshInvitationPaths } from "@/features/invitations/actions/invitation-action-support"
import type { InvitationAcceptanceDto } from "@/features/invitations/invitation.types"
import { declineInvitation } from "@/features/invitations/services/invitation.service"
import type { ActionState } from "@/lib/action-state"
import { actionSuccess } from "@/lib/action-state"

export async function declineInvitationAction(
  _: ActionState<InvitationAcceptanceDto>,
  formData: FormData,
): Promise<ActionState<InvitationAcceptanceDto>> {
  try {
    const declined = await declineInvitation({ token: formData.get("token") })
    refreshInvitationPaths(declined.workspaceId, declined.projectId)
    return actionSuccess(declined, "Invitation declined.")
  } catch (error) {
    return invitationActionError<InvitationAcceptanceDto>(error)
  }
}
