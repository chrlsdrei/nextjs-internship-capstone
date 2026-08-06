import "server-only"

import { listProjectInvitations } from "@/features/invitations/server/invitation.service"
import {
  projectMemberIdSchema,
  projectMemberSchema,
  updateProjectMemberRoleSchema,
} from "@/features/members/member.schema"
import type { ProjectManagementDto, ProjectMemberDto } from "@/features/members/member.types"
import {
  findWorkspaceMemberByEmail,
  findWorkspaceOwnerForProject,
  insertProjectMember,
  listProjectMembers,
  softRemoveMemberAndUnassignTasks,
  updateMemberRole,
} from "@/features/members/server/member.repository"
import { projectManagementCapabilities } from "@/features/projects/project.policy"
import { projectIdSchema } from "@/features/projects/project.schema"
import { getProjectById, getProjectSettings } from "@/features/projects/server/project.service"
import { ProjectAccessError, requireProjectPermission } from "@/features/projects/server/project-access.service"
import { enforceRateLimit } from "@/features/rate-limits/server/rate-limit.service"
import {
  findActiveWorkspaceAccess,
  listActiveWorkspaceMembers,
} from "@/features/workspaces/server/workspace.repository"
import { canInviteWorkspaceOutsiders, resolveWorkspaceRole } from "@/features/workspaces/workspace.policy"

export async function getProjectMembers(projectId: string): Promise<ProjectMemberDto[]> {
  const id = projectIdSchema.parse(projectId)
  await requireProjectPermission(id, "view")
  const members = await listProjectMembers(id)
  return members.map((member) => ({ ...member, createdAt: member.createdAt.toISOString() }))
}

export async function getProjectManagementData(projectId: string): Promise<ProjectManagementDto> {
  const id = projectIdSchema.parse(projectId)
  const access = await requireProjectPermission(id, "manage")
  const [project, members, workspaceOwner, settings, workspaceAccess, invitations] = await Promise.all([
    getProjectById(id),
    getProjectMembers(id),
    findWorkspaceOwnerForProject(id),
    getProjectSettings(id),
    findActiveWorkspaceAccess(access.workspaceId, access.user.id),
    listProjectInvitations(id),
  ])
  if (!workspaceOwner) throw new ProjectAccessError("Workspace owner not found", 404)
  if (!workspaceAccess) throw new ProjectAccessError("Workspace access not found", 404)
  const workspaceRole = resolveWorkspaceRole(workspaceAccess.ownerWorkspaceMemberId, {
    id: workspaceAccess.membershipId,
    role: workspaceAccess.membershipRole,
    removedAt: workspaceAccess.membershipRemovedAt,
  })
  const activeWorkspaceMembers = await listActiveWorkspaceMembers(access.workspaceId)
  const projectWorkspaceMemberIds = new Set(members.map((member) => member.workspaceMemberId))
  const activelyInvitedEmails = new Set(
    invitations
      .filter((invitation) => !invitation.acceptedAt && !invitation.revokedAt)
      .map((invitation) => invitation.email.trim().toLowerCase()),
  )
  return {
    project,
    workspace: {
      id: workspaceOwner.workspaceId,
      name: workspaceOwner.workspaceName,
      canInviteNewMembers: canInviteWorkspaceOutsiders(workspaceRole),
    },
    members,
    workspaceOwner: {
      userId: workspaceOwner.userId,
      workspaceMemberId: workspaceOwner.workspaceMemberId,
      email: workspaceOwner.email,
      name: workspaceOwner.name,
      explicitProjectMemberId: workspaceOwner.explicitProjectMemberId,
      explicitRole: workspaceOwner.explicitRole,
    },
    settings,
    capabilities: projectManagementCapabilities(access.role),
    role: access.role,
    availableWorkspaceMembers: activeWorkspaceMembers
      .filter(
        (member) =>
          !projectWorkspaceMemberIds.has(member.id) && !activelyInvitedEmails.has(member.email.trim().toLowerCase()),
      )
      .map((member) => ({ id: member.id, email: member.email, name: member.name })),
    invitations,
  }
}

export async function addProjectMember(projectId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const values = projectMemberSchema.parse(input)
  const access = await requireProjectPermission(id, "manage")
  const workspaceMember = await findWorkspaceMemberByEmail(id, values.email)
  if (!workspaceMember) {
    throw new ProjectAccessError("That user must be an active member of this project's workspace", 422)
  }
  await enforceRateLimit({ action: "member.admin", actorUserId: access.user.id, workspaceId: access.workspaceId })

  const member = await insertProjectMember(id, access.user.id, workspaceMember, values)
  if (!member) {
    throw new ProjectAccessError("That user is already a project member or you cannot manage this project", 409)
  }
  return member
}

export async function updateProjectMemberRole(projectId: string, memberId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const parsedMemberId = projectMemberIdSchema.parse(memberId)
  const values = updateProjectMemberRoleSchema.parse(input)
  const access = await requireProjectPermission(id, "manage")
  await enforceRateLimit({ action: "member.admin", actorUserId: access.user.id, workspaceId: access.workspaceId })
  const member = await updateMemberRole(id, access.user.id, parsedMemberId, values)
  if (!member) throw new ProjectAccessError("Project member not found or cannot be changed", 404)
  return member
}

export async function removeProjectMember(projectId: string, memberId: string) {
  const id = projectIdSchema.parse(projectId)
  const parsedMemberId = projectMemberIdSchema.parse(memberId)
  const access = await requireProjectPermission(id, "manage")
  await enforceRateLimit({ action: "member.admin", actorUserId: access.user.id, workspaceId: access.workspaceId })
  const member = await softRemoveMemberAndUnassignTasks(id, access.user.id, parsedMemberId)
  if (!member) throw new ProjectAccessError("Project member not found or cannot be removed", 404)
}
