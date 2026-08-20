import "server-only"

import { recordActivity } from "@/features/activity/services/activity.service"
import { getCurrentDatabaseUser } from "@/features/auth/services/session.service"
import { requireWorkspaceWritable } from "@/features/billing/services/entitlement.service"
import { enforceRateLimit } from "@/features/rate-limits/services/rate-limit.service"
import {
  countActiveWorkspaceMembers,
  createWorkspaceWithOwner,
  findActiveWorkspaceAccess,
  findActiveWorkspaceMember,
  listActiveWorkspaceMembers,
  listActiveWorkspaceMemberships,
  softRemoveWorkspaceMemberById,
  transferWorkspaceOwnership,
  updateWorkspaceDetailsById,
  updateWorkspaceMemberRoleById,
  updateWorkspaceSettingsById,
} from "@/features/workspaces/repositories/workspace.repository"
import { WorkspaceAccessError } from "@/features/workspaces/workspace.error"
import {
  canChangeWorkspaceMemberRole,
  canRemoveWorkspaceMember,
  canTransferWorkspaceOwnership,
  resolveWorkspaceRole,
  workspaceCapabilities,
} from "@/features/workspaces/workspace.policy"
import {
  createWorkspaceSchema,
  removeWorkspaceMemberSchema,
  transferWorkspaceOwnershipSchema,
  updateWorkspaceDetailsSchema,
  updateWorkspaceMemberRoleSchema,
  updateWorkspaceSettingsSchema,
  workspaceIdSchema,
} from "@/features/workspaces/workspace.schema"
import type {
  WorkspaceDetailDto,
  WorkspaceMemberDto,
  WorkspaceRole,
  WorkspaceSummaryDto,
} from "@/features/workspaces/workspace.types"

type WorkspaceAccess = NonNullable<Awaited<ReturnType<typeof findActiveWorkspaceAccess>>>

function effectiveRole(access: WorkspaceAccess): WorkspaceRole {
  const role = resolveWorkspaceRole(access.ownerWorkspaceMemberId, {
    id: access.membershipId,
    role: access.membershipRole,
    removedAt: access.membershipRemovedAt,
  })
  if (!role) throw new WorkspaceAccessError("Workspace not found", 404)
  return role
}

function summaryDto(access: WorkspaceAccess, role: WorkspaceRole, memberCount: number): WorkspaceSummaryDto {
  return {
    id: access.id,
    name: access.name,
    description: access.description,
    status: access.status,
    role,
    memberCount,
    membersCanCreateProjects: access.membersCanCreateProjects,
    createdAt: access.createdAt.toISOString(),
    updatedAt: access.updatedAt.toISOString(),
  }
}

async function detailDto(
  access: WorkspaceAccess,
  role: WorkspaceRole,
  currentUserId: string,
): Promise<WorkspaceDetailDto> {
  const members = await listActiveWorkspaceMembers(access.id)
  const memberDtos: WorkspaceMemberDto[] = members.map((member) => {
    const memberRole: WorkspaceRole = member.id === access.ownerWorkspaceMemberId ? "owner" : member.role
    return {
      id: member.id,
      userId: member.userId,
      name: member.name,
      email: member.email,
      role: memberRole,
      joinedAt: member.joinedAt.toISOString(),
      capabilities: {
        canChangeRole: canChangeWorkspaceMemberRole(role, memberRole),
        canRemove: canRemoveWorkspaceMember(role, memberRole, member.userId === currentUserId),
        canReceiveOwnership: canTransferWorkspaceOwnership(role) && memberRole !== "owner",
      },
    }
  })

  return {
    ...summaryDto(access, role, memberDtos.length),
    capabilities: workspaceCapabilities(role),
    members: memberDtos,
  }
}

async function requireWorkspaceAccess(workspaceId: string) {
  const id = workspaceIdSchema.parse(workspaceId)
  const user = await getCurrentDatabaseUser()
  const access = await findActiveWorkspaceAccess(id, user.id)
  if (!access) throw new WorkspaceAccessError("Workspace not found", 404)
  return { access, role: effectiveRole(access), user }
}

function requireActiveWorkspace(access: WorkspaceAccess) {
  if (access.status !== "active") {
    throw new WorkspaceAccessError("This workspace is suspended and cannot be changed", 403)
  }
}

export async function listWorkspaces(): Promise<WorkspaceSummaryDto[]> {
  const user = await getCurrentDatabaseUser()
  const memberships = await listActiveWorkspaceMemberships(user.id)
  return Promise.all(
    memberships.map(async (access) => {
      const role = effectiveRole(access)
      return summaryDto(access, role, await countActiveWorkspaceMembers(access.id))
    }),
  )
}

export async function getWorkspaceDetails(workspaceId: string): Promise<WorkspaceDetailDto> {
  const { access, role, user } = await requireWorkspaceAccess(workspaceId)
  return detailDto(access, role, user.id)
}

export async function listWorkspaceTeamDetails(): Promise<WorkspaceDetailDto[]> {
  const user = await getCurrentDatabaseUser()
  const memberships = await listActiveWorkspaceMemberships(user.id)
  return Promise.all(
    memberships.map((access) => {
      const role = effectiveRole(access)
      return detailDto(access, role, user.id)
    }),
  )
}

export async function createWorkspace(input: unknown): Promise<WorkspaceSummaryDto> {
  const values = createWorkspaceSchema.parse(input)
  const user = await getCurrentDatabaseUser()
  await enforceRateLimit({ action: "workspace.create", actorUserId: user.id })
  const workspace = await createWorkspaceWithOwner(user.id, values)
  if (!workspace) throw new Error("Unable to create the workspace")
  const access = await findActiveWorkspaceAccess(workspace.id, user.id)
  if (!access) throw new Error("Unable to load the newly created workspace")
  await recordActivity({
    workspaceId: access.id,
    actorWorkspaceMemberId: access.membershipId,
    event: { action: "workspace.created", metadata: { actorName: user.name, workspaceName: access.name } },
  })
  return summaryDto(access, "owner", 1)
}

export async function updateWorkspaceDetails(workspaceId: string, input: unknown) {
  const values = updateWorkspaceDetailsSchema.parse(input)
  const { access, role, user } = await requireWorkspaceAccess(workspaceId)
  requireActiveWorkspace(access)
  if (role !== "owner") throw new WorkspaceAccessError("Only the workspace owner can update its details", 403)
  await requireWorkspaceWritable(access.id, user.id)
  await enforceRateLimit({ action: "workspace.admin", actorUserId: user.id, workspaceId: access.id })
  const workspace = await updateWorkspaceDetailsById(access.id, values)
  if (!workspace) throw new WorkspaceAccessError("Workspace not found", 404)
  await recordActivity({
    workspaceId: access.id,
    actorWorkspaceMemberId: access.membershipId,
    event: { action: "workspace.updated", metadata: { actorName: user.name, workspaceName: workspace.name } },
  })
  return getWorkspaceDetails(access.id)
}

export async function updateWorkspaceSettings(workspaceId: string, input: unknown) {
  const values = updateWorkspaceSettingsSchema.parse(input)
  const { access, role, user } = await requireWorkspaceAccess(workspaceId)
  requireActiveWorkspace(access)
  if (role !== "owner") throw new WorkspaceAccessError("Only the workspace owner can update settings", 403)
  await requireWorkspaceWritable(access.id, user.id)
  await enforceRateLimit({ action: "workspace.admin", actorUserId: user.id, workspaceId: access.id })
  const settings = await updateWorkspaceSettingsById(access.id, values)
  if (!settings) throw new WorkspaceAccessError("Workspace settings not found", 404)
  await recordActivity({
    workspaceId: access.id,
    actorWorkspaceMemberId: access.membershipId,
    event: {
      action: "workspace.settings_updated",
      metadata: {
        actorName: user.name,
        workspaceName: access.name,
        membersCanCreateProjects: settings.membersCanCreateProjects,
      },
    },
  })
  return getWorkspaceDetails(access.id)
}

export async function updateWorkspaceMemberRole(workspaceId: string, input: unknown) {
  const values = updateWorkspaceMemberRoleSchema.parse(input)
  const { access, role, user } = await requireWorkspaceAccess(workspaceId)
  requireActiveWorkspace(access)
  await requireWorkspaceWritable(access.id, user.id)
  const target = await findActiveWorkspaceMember(access.id, values.memberId)
  if (!target) throw new WorkspaceAccessError("Workspace member not found", 404)
  const targetSnapshot = (await listActiveWorkspaceMembers(access.id)).find((member) => member.id === target.id)
  if (!targetSnapshot) throw new WorkspaceAccessError("Workspace member not found", 404)
  const targetRole = target.id === access.ownerWorkspaceMemberId ? "owner" : target.role
  if (!canChangeWorkspaceMemberRole(role, targetRole)) {
    throw new WorkspaceAccessError("Only the owner can change non-owner member roles", 403)
  }
  await enforceRateLimit({ action: "workspace.admin", actorUserId: user.id, workspaceId: access.id })
  const member = await updateWorkspaceMemberRoleById(target.id, values.role)
  if (!member) throw new WorkspaceAccessError("Workspace member not found", 404)
  await recordActivity({
    workspaceId: access.id,
    actorWorkspaceMemberId: access.membershipId,
    event: {
      action: "workspace.member_role_updated",
      metadata: {
        actorName: user.name,
        workspaceName: access.name,
        memberName: targetSnapshot.name,
        previousRole: target.role,
        role: member.role,
      },
    },
  })
  return getWorkspaceDetails(access.id)
}

export async function removeWorkspaceMember(workspaceId: string, input: unknown) {
  const values = removeWorkspaceMemberSchema.parse(input)
  const { access, role, user } = await requireWorkspaceAccess(workspaceId)
  requireActiveWorkspace(access)
  const target = await findActiveWorkspaceMember(access.id, values.memberId)
  if (!target) throw new WorkspaceAccessError("Workspace member not found", 404)
  const targetSnapshot = (await listActiveWorkspaceMembers(access.id)).find((member) => member.id === target.id)
  if (!targetSnapshot) throw new WorkspaceAccessError("Workspace member not found", 404)
  const targetRole: WorkspaceRole = target.id === access.ownerWorkspaceMemberId ? "owner" : target.role
  if (!canRemoveWorkspaceMember(role, targetRole, target.userId === user.id)) {
    throw new WorkspaceAccessError("You cannot remove this workspace member", 403)
  }
  await enforceRateLimit({ action: "workspace.admin", actorUserId: user.id, workspaceId: access.id })
  const member = await softRemoveWorkspaceMemberById(target.id)
  if (!member) throw new WorkspaceAccessError("Workspace member not found", 404)
  await recordActivity({
    workspaceId: access.id,
    actorWorkspaceMemberId: access.membershipId,
    event: {
      action: "workspace.member_removed",
      metadata: { actorName: user.name, workspaceName: access.name, memberName: targetSnapshot.name },
    },
  })
  return { workspaceId: access.id, removedMemberId: member.id }
}

export async function transferWorkspaceOwnershipTo(workspaceId: string, input: unknown) {
  const values = transferWorkspaceOwnershipSchema.parse(input)
  const { access, role, user } = await requireWorkspaceAccess(workspaceId)
  requireActiveWorkspace(access)
  if (!canTransferWorkspaceOwnership(role)) {
    throw new WorkspaceAccessError("Only the owner can transfer workspace ownership", 403)
  }
  await requireWorkspaceWritable(access.id, user.id)
  if (values.newOwnerMemberId === access.ownerWorkspaceMemberId) {
    throw new WorkspaceAccessError("This member already owns the workspace", 400)
  }
  const target = await findActiveWorkspaceMember(access.id, values.newOwnerMemberId)
  if (!target) throw new WorkspaceAccessError("The new owner must be an active workspace member", 400)
  const memberSnapshots = await listActiveWorkspaceMembers(access.id)
  const previousOwner = memberSnapshots.find((member) => member.id === access.ownerWorkspaceMemberId)
  const newOwner = memberSnapshots.find((member) => member.id === target.id)
  if (!previousOwner || !newOwner) throw new WorkspaceAccessError("Workspace owner information is unavailable", 409)
  await enforceRateLimit({ action: "workspace.admin", actorUserId: user.id, workspaceId: access.id })
  const workspace = await transferWorkspaceOwnership(access.id, access.ownerWorkspaceMemberId, target.id)
  if (!workspace) throw new WorkspaceAccessError("Workspace ownership changed; refresh and try again", 409)
  await recordActivity({
    workspaceId: access.id,
    actorWorkspaceMemberId: access.membershipId,
    event: {
      action: "workspace.ownership_transferred",
      metadata: {
        actorName: user.name,
        workspaceName: access.name,
        previousOwnerName: previousOwner.name,
        newOwnerName: newOwner.name,
      },
    },
  })
  return getWorkspaceDetails(access.id)
}
