import "server-only"

import { listWorkspaceInvitations as listWorkspaceInvitationsService } from "@/features/invitations/services/invitation.service"

export async function listWorkspaceInvitations(
  ...args: Parameters<typeof listWorkspaceInvitationsService>
): Promise<Awaited<ReturnType<typeof listWorkspaceInvitationsService>>> {
  return listWorkspaceInvitationsService(...args)
}
