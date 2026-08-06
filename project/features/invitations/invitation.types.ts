export type InvitationKind = "workspace" | "project"
export type InvitationDeliveryStatus = "pending" | "sent" | "failed"
export type InvitationWorkspaceRole = "admin" | "member"
export type InvitationBoardRole = "board_admin" | "editor" | "viewer"

export type InvitationDto = {
  id: string
  kind: InvitationKind
  workspaceId: string
  workspaceName: string
  projectId: string | null
  projectTitle: string | null
  email: string
  workspaceRole: InvitationWorkspaceRole | null
  boardRole: InvitationBoardRole | null
  deliveryStatus: InvitationDeliveryStatus
  expiresAt: string
  acceptedAt: string | null
  revokedAt: string | null
  createdAt: string
}

export type InvitationAcceptanceDto = {
  invitationId: string
  workspaceId: string
  projectId: string | null
}
