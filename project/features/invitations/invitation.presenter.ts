import type { InvitationDto } from "@/features/invitations/invitation.types"

export function invitationDisplayState(invitation: InvitationDto, now = new Date()) {
  if (invitation.acceptedAt) return { key: "accepted", label: "Accepted" } as const
  if (invitation.revokedAt) return { key: "revoked", label: "Revoked" } as const
  if (invitation.declinedAt) return { key: "declined", label: "Declined" } as const
  if (new Date(invitation.expiresAt) <= now) return { key: "expired", label: "Expired" } as const
  if (invitation.deliveryStatus === "failed") return { key: "failed", label: "Email failed" } as const
  if (invitation.deliveryStatus === "pending") return { key: "pending", label: "Sending" } as const
  return { key: "active", label: "Awaiting acceptance" } as const
}

export function isPendingInvitation(invitation: InvitationDto, now = new Date()) {
  return (
    !invitation.acceptedAt && !invitation.revokedAt && !invitation.declinedAt && new Date(invitation.expiresAt) > now
  )
}
