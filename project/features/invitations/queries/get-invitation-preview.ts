import "server-only"

import { getInvitationPreview as getInvitationPreviewService } from "@/features/invitations/services/invitation.service"

export async function getInvitationPreview(
  ...args: Parameters<typeof getInvitationPreviewService>
): Promise<Awaited<ReturnType<typeof getInvitationPreviewService>>> {
  return getInvitationPreviewService(...args)
}
