import "server-only"

import { recordActivity } from "@/features/activity/services/activity.service"
import { getCurrentDatabaseUser, getVerifiedPrimaryEmail } from "@/features/auth/services/session.service"
import { requireMemberCapacity, requireWorkspaceWritable } from "@/features/billing/services/entitlement.service"
import { sendInvitationEmail } from "@/features/invitations/gateways/invitation-email.gateway"
import { InvitationError } from "@/features/invitations/invitation.error"
import {
  acceptInvitationSchema,
  createProjectInvitationSchema,
  createWorkspaceInvitationSchema,
  invitationIdSchema,
} from "@/features/invitations/invitation.schema"
import type { InvitationDto, InvitationPreviewDto } from "@/features/invitations/invitation.types"
import {
  acceptInvitationRecord,
  createInvitationRecord,
  declineInvitationRecord,
  findActiveWorkspaceMemberByNormalizedEmail,
  findInvitationById,
  findInvitationByTokenHash,
  hasActiveProjectMembership,
  listWorkspaceInvitationRecords,
  recordInvitationDelivery,
  recordInvitationDeliveryFailure,
  revokeInvitationRecord,
  rotateInvitationToken,
} from "@/features/invitations/repositories/invitation.repository"
import {
  createInvitationToken,
  hashInvitationToken,
  invitationExpiry,
} from "@/features/invitations/services/invitation-token"
import { publishInvitationNotification } from "@/features/notifications/services/notification.service"
import { requireProjectPermission } from "@/features/projects/services/project-access.service"
import { enforceRateLimit } from "@/features/rate-limits/services/rate-limit.service"
import { findActiveWorkspaceAccess } from "@/features/workspaces/repositories/workspace.repository"
import { canInviteWorkspaceOutsiders, resolveWorkspaceRole } from "@/features/workspaces/workspace.policy"

type InvitationRecord = NonNullable<Awaited<ReturnType<typeof findInvitationById>>>

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@")
  if (!localPart || !domain) return "Hidden recipient"
  const visible = localPart.slice(0, Math.min(2, localPart.length))
  return `${visible}${"•".repeat(Math.max(3, localPart.length - visible.length))}@${domain}`
}

function toDto(invitation: InvitationRecord): InvitationDto {
  return {
    id: invitation.id,
    kind: invitation.kind,
    workspaceId: invitation.workspaceId,
    workspaceName: invitation.workspaceName,
    projectId: invitation.projectId,
    projectTitle: invitation.projectTitle,
    email: invitation.email,
    workspaceRole: invitation.workspaceRole,
    boardRole: invitation.boardRole,
    deliveryStatus: invitation.deliveryStatus,
    expiresAt: invitation.expiresAt.toISOString(),
    acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
    revokedAt: invitation.revokedAt?.toISOString() ?? null,
    declinedAt: invitation.declinedAt?.toISOString() ?? null,
    createdAt: invitation.createdAt.toISOString(),
  }
}

async function requireWorkspaceInvitationAuthority(workspaceId: string) {
  const user = await getCurrentDatabaseUser()
  const access = await findActiveWorkspaceAccess(workspaceId, user.id)
  if (access?.status !== "active") {
    throw new InvitationError("Workspace not found", "INVITATION_FORBIDDEN", 404)
  }
  const role = resolveWorkspaceRole(access.ownerWorkspaceMemberId, {
    id: access.membershipId,
    role: access.membershipRole,
    removedAt: access.membershipRemovedAt,
  })
  if (role !== "owner" && role !== "admin") {
    throw new InvitationError("Only workspace owners and admins can invite new members", "INVITATION_FORBIDDEN", 403)
  }
  return { user, access }
}

async function deliver(invitation: InvitationRecord, token: string) {
  try {
    const messageId = await sendInvitationEmail({
      invitationId: invitation.id,
      deliveryAttempt: invitation.deliveryAttempt,
      recipient: invitation.email,
      kind: invitation.kind,
      workspaceName: invitation.workspaceName,
      projectTitle: invitation.projectTitle,
      workspaceRole: invitation.workspaceRole,
      boardRole: invitation.boardRole,
      token,
      expiresAt: invitation.expiresAt,
    })
    await recordInvitationDelivery(invitation.id, messageId)
  } catch (error) {
    const code = error instanceof InvitationError ? error.code : "INVITATION_DELIVERY_FAILED"
    await recordInvitationDeliveryFailure(invitation.id, code)
    throw error instanceof InvitationError
      ? error
      : new InvitationError("The invitation was saved, but its email could not be sent", code, 502)
  }
}

async function requireInvitationManagement(invitationId: string) {
  const id = invitationIdSchema.parse(invitationId)
  const invitation = await findInvitationById(id)
  if (!invitation) throw new InvitationError("Invitation not found", "INVITATION_INVALID", 404)
  if (invitation.kind === "project" && invitation.projectId) {
    const access = await requireProjectPermission(invitation.projectId, "manage")
    return { invitation, user: access.user, actorWorkspaceMemberId: access.workspaceMemberId }
  }
  const authority = await requireWorkspaceInvitationAuthority(invitation.workspaceId)
  return {
    invitation,
    user: authority.user,
    actorWorkspaceMemberId: authority.access.membershipId,
  }
}

export async function createWorkspaceInvitation(input: unknown): Promise<InvitationDto> {
  const values = createWorkspaceInvitationSchema.parse(input)
  const { user, access } = await requireWorkspaceInvitationAuthority(values.workspaceId)
  await requireWorkspaceWritable(access.id, user.id)
  if (await findActiveWorkspaceMemberByNormalizedEmail(access.id, normalizeEmail(values.email))) {
    throw new InvitationError("This email already belongs to an active workspace member", "INVITATION_CONFLICT", 409)
  }
  if (values.projectId) {
    const projectAccess = await requireProjectPermission(values.projectId, "manage")
    if (projectAccess.workspaceId !== access.id) {
      throw new InvitationError("The selected project does not belong to this workspace", "INVITATION_FORBIDDEN", 400)
    }
  }
  await enforceRateLimit({ action: "invitation.create", actorUserId: user.id, workspaceId: access.id })

  const token = createInvitationToken()
  let invitation: InvitationRecord | null
  try {
    invitation = await createInvitationRecord({
      kind: "workspace",
      workspaceId: access.id,
      projectId: values.projectId ?? null,
      invitedByWorkspaceMemberId: access.membershipId,
      email: values.email.trim(),
      normalizedEmail: normalizeEmail(values.email),
      workspaceRole: values.workspaceRole,
      boardRole: values.boardRole ?? null,
      tokenHash: hashInvitationToken(token),
      expiresAt: invitationExpiry(),
    })
  } catch (error) {
    if ((error as { cause?: { code?: string } }).cause?.code === "23505") {
      throw new InvitationError("An active invitation already exists for this email", "INVITATION_CONFLICT", 409)
    }
    throw error
  }
  if (!invitation) throw new Error("Unable to create invitation")
  await recordActivity({
    workspaceId: access.id,
    projectId: invitation.projectId,
    actorWorkspaceMemberId: access.membershipId,
    event: {
      action: "invitation.created",
      metadata: {
        actorName: user.name,
        workspaceName: invitation.workspaceName,
        invitedEmail: invitation.normalizedEmail,
        invitationKind: invitation.kind,
        projectTitle: invitation.projectTitle,
      },
    },
  })
  await deliver(invitation, token)
  await publishInvitationNotification(invitation.id)
  return toDto({ ...invitation, deliveryStatus: "sent" })
}

export async function createProjectInvitation(input: unknown): Promise<InvitationDto> {
  const values = createProjectInvitationSchema.parse(input)
  const access = await requireProjectPermission(values.projectId, "manage")
  await requireWorkspaceWritable(access.workspaceId, access.user.id)
  const workspaceMember = await findActiveWorkspaceMemberByNormalizedEmail(
    access.workspaceId,
    normalizeEmail(values.email),
  )
  if (!workspaceMember) {
    throw new InvitationError("Board invitations can only target active workspace members", "INVITATION_FORBIDDEN", 400)
  }
  if (await hasActiveProjectMembership(access.projectId, workspaceMember.id)) {
    throw new InvitationError("This workspace member already belongs to the project", "INVITATION_CONFLICT", 409)
  }
  await enforceRateLimit({ action: "invitation.create", actorUserId: access.user.id, workspaceId: access.workspaceId })

  const token = createInvitationToken()
  let invitation: InvitationRecord | null
  try {
    invitation = await createInvitationRecord({
      kind: "project",
      workspaceId: access.workspaceId,
      projectId: access.projectId,
      invitedByWorkspaceMemberId: access.workspaceMemberId,
      email: values.email.trim(),
      normalizedEmail: normalizeEmail(values.email),
      workspaceRole: null,
      boardRole: values.boardRole,
      tokenHash: hashInvitationToken(token),
      expiresAt: invitationExpiry(),
    })
  } catch (error) {
    if ((error as { cause?: { code?: string } }).cause?.code === "23505") {
      throw new InvitationError("An active invitation already exists for this email", "INVITATION_CONFLICT", 409)
    }
    throw error
  }
  if (!invitation) throw new Error("Unable to create invitation")
  await recordActivity({
    workspaceId: access.workspaceId,
    projectId: invitation.projectId,
    actorWorkspaceMemberId: access.workspaceMemberId,
    event: {
      action: "invitation.created",
      metadata: {
        actorName: access.user.name,
        workspaceName: invitation.workspaceName,
        invitedEmail: invitation.normalizedEmail,
        invitationKind: invitation.kind,
        projectTitle: invitation.projectTitle,
      },
    },
  })
  await deliver(invitation, token)
  await publishInvitationNotification(invitation.id)
  return toDto({ ...invitation, deliveryStatus: "sent" })
}

export async function listWorkspaceInvitations(workspaceId: string): Promise<InvitationDto[]> {
  const { access } = await requireWorkspaceInvitationAuthority(workspaceId)
  return (await listWorkspaceInvitationRecords(access.id))
    .filter((invitation) => invitation.kind === "workspace")
    .map(toDto)
}

export async function listProjectInvitations(projectId: string): Promise<InvitationDto[]> {
  const access = await requireProjectPermission(projectId, "manage")
  const workspaceAccess = await findActiveWorkspaceAccess(access.workspaceId, access.user.id)
  const workspaceRole = workspaceAccess
    ? resolveWorkspaceRole(workspaceAccess.ownerWorkspaceMemberId, {
        id: workspaceAccess.membershipId,
        role: workspaceAccess.membershipRole,
        removedAt: workspaceAccess.membershipRemovedAt,
      })
    : null
  const canManageWorkspaceInvitations = canInviteWorkspaceOutsiders(workspaceRole)
  return (await listWorkspaceInvitationRecords(access.workspaceId))
    .filter(
      (invitation) =>
        invitation.projectId === access.projectId && (invitation.kind === "project" || canManageWorkspaceInvitations),
    )
    .map(toDto)
}

export async function getInvitationPreview(token: string): Promise<InvitationPreviewDto> {
  const parsed = acceptInvitationSchema.safeParse({ token })
  if (!parsed.success) {
    return { state: "invalid", workspaceName: null, projectTitle: null, maskedEmail: null, expiresAt: null }
  }
  const invitation = await findInvitationByTokenHash(hashInvitationToken(parsed.data.token))
  if (!invitation) {
    return { state: "invalid", workspaceName: null, projectTitle: null, maskedEmail: null, expiresAt: null }
  }
  const state = invitation.acceptedAt
    ? "accepted"
    : invitation.revokedAt
      ? "revoked"
      : invitation.declinedAt
        ? "declined"
        : invitation.expiresAt <= new Date()
          ? "expired"
          : "active"
  return {
    state,
    workspaceName: invitation.workspaceName,
    projectTitle: invitation.projectTitle,
    maskedEmail: maskEmail(invitation.email),
    expiresAt: invitation.expiresAt.toISOString(),
  }
}

export async function resendInvitation(invitationId: string): Promise<InvitationDto> {
  const { actorWorkspaceMemberId, invitation, user } = await requireInvitationManagement(invitationId)
  await requireWorkspaceWritable(invitation.workspaceId, user.id)
  await enforceRateLimit({ action: "invitation.resend", actorUserId: user.id, workspaceId: invitation.workspaceId })
  const token = createInvitationToken()
  const rotated = await rotateInvitationToken(invitation.id, hashInvitationToken(token), invitationExpiry())
  if (!rotated) throw new InvitationError("Only active invitations can be resent", "INVITATION_INVALID", 409)
  await recordActivity({
    workspaceId: invitation.workspaceId,
    projectId: invitation.projectId,
    actorWorkspaceMemberId,
    event: {
      action: "invitation.resent",
      metadata: {
        actorName: user.name,
        workspaceName: invitation.workspaceName,
        invitedEmail: invitation.normalizedEmail,
        invitationKind: invitation.kind,
        projectTitle: invitation.projectTitle,
      },
    },
  })
  await deliver(rotated, token)
  return toDto({ ...rotated, deliveryStatus: "sent" })
}

export async function revokeInvitation(invitationId: string): Promise<InvitationDto> {
  const { actorWorkspaceMemberId, invitation, user } = await requireInvitationManagement(invitationId)
  await enforceRateLimit({ action: "invitation.revoke", actorUserId: user.id, workspaceId: invitation.workspaceId })
  const revoked = await revokeInvitationRecord(invitation.id, user.id)
  if (!revoked) throw new InvitationError("Only active invitations can be revoked", "INVITATION_INVALID", 409)
  await recordActivity({
    workspaceId: invitation.workspaceId,
    projectId: invitation.projectId,
    actorWorkspaceMemberId,
    event: {
      action: "invitation.revoked",
      metadata: {
        actorName: user.name,
        workspaceName: invitation.workspaceName,
        invitedEmail: invitation.normalizedEmail,
        invitationKind: invitation.kind,
        projectTitle: invitation.projectTitle,
      },
    },
  })
  return toDto(revoked)
}

export async function acceptInvitation(input: unknown) {
  const values = acceptInvitationSchema.parse(input)
  const user = await getCurrentDatabaseUser()
  await enforceRateLimit({ action: "invitation.accept", actorUserId: user.id })
  let normalizedEmail: string
  try {
    normalizedEmail = await getVerifiedPrimaryEmail()
  } catch (error) {
    throw new InvitationError(
      error instanceof Error ? error.message : "Verify your primary email before accepting this invitation",
      "INVITATION_EMAIL_MISMATCH",
      403,
    )
  }
  const tokenHash = hashInvitationToken(values.token)
  const pendingInvitation = await findInvitationByTokenHash(tokenHash)
  if (pendingInvitation) {
    if (await findActiveWorkspaceAccess(pendingInvitation.workspaceId, user.id)) {
      await requireWorkspaceWritable(pendingInvitation.workspaceId, user.id)
    } else {
      await requireMemberCapacity(pendingInvitation.workspaceId, user.id)
    }
  }
  const accepted = await acceptInvitationRecord(tokenHash, user.id, normalizedEmail, user.name)
  if (accepted) return accepted

  const invitation = await findInvitationByTokenHash(tokenHash)
  if (!invitation) throw new InvitationError("Invitation is invalid", "INVITATION_INVALID", 404)
  if (invitation.acceptedAt)
    throw new InvitationError("Invitation has already been accepted", "INVITATION_ACCEPTED", 409)
  if (invitation.revokedAt) throw new InvitationError("Invitation has been revoked", "INVITATION_REVOKED", 410)
  if (invitation.declinedAt) throw new InvitationError("Invitation has been declined", "INVITATION_DECLINED", 410)
  if (invitation.expiresAt <= new Date()) throw new InvitationError("Invitation has expired", "INVITATION_EXPIRED", 410)
  if (invitation.normalizedEmail !== normalizedEmail) {
    throw new InvitationError(
      "Sign in with the email address that received this invitation",
      "INVITATION_EMAIL_MISMATCH",
      403,
    )
  }
  throw new InvitationError("The invitation cannot be accepted", "INVITATION_INVALID", 409)
}

export async function declineInvitation(input: unknown) {
  const values = acceptInvitationSchema.parse(input)
  const user = await getCurrentDatabaseUser()
  await enforceRateLimit({ action: "invitation.accept", actorUserId: user.id })

  let normalizedEmail: string
  try {
    normalizedEmail = await getVerifiedPrimaryEmail()
  } catch (error) {
    throw new InvitationError(
      error instanceof Error ? error.message : "Verify your primary email before declining this invitation",
      "INVITATION_EMAIL_MISMATCH",
      403,
    )
  }

  const tokenHash = hashInvitationToken(values.token)
  const declined = await declineInvitationRecord(tokenHash, user.id, normalizedEmail)
  if (declined) {
    return {
      invitationId: declined.id,
      workspaceId: declined.workspaceId,
      projectId: declined.projectId,
    }
  }

  const invitation = await findInvitationByTokenHash(tokenHash)
  if (!invitation) throw new InvitationError("Invitation is invalid", "INVITATION_INVALID", 404)
  if (invitation.acceptedAt)
    throw new InvitationError("Invitation has already been accepted", "INVITATION_ACCEPTED", 409)
  if (invitation.revokedAt) throw new InvitationError("Invitation has been revoked", "INVITATION_REVOKED", 410)
  if (invitation.declinedAt)
    throw new InvitationError("Invitation has already been declined", "INVITATION_DECLINED", 409)
  if (invitation.expiresAt <= new Date()) throw new InvitationError("Invitation has expired", "INVITATION_EXPIRED", 410)
  if (invitation.normalizedEmail !== normalizedEmail) {
    throw new InvitationError(
      "Sign in with the email address that received this invitation",
      "INVITATION_EMAIL_MISMATCH",
      403,
    )
  }
  throw new InvitationError("The invitation cannot be declined", "INVITATION_INVALID", 409)
}
