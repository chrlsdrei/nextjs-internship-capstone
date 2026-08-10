import type {
  StoredWorkspaceRole,
  WorkspaceCapabilitiesDto,
  WorkspaceRole,
  WorkspaceSummaryDto,
} from "./workspace.types"

export function canCreateProjectInWorkspace(
  workspace: Pick<WorkspaceSummaryDto, "role" | "membersCanCreateProjects" | "status">,
) {
  if (workspace.status !== "active") return false
  return workspace.role === "owner" || workspace.role === "admin" || workspace.membersCanCreateProjects
}

export function resolveWorkspaceRole(
  ownerWorkspaceMemberId: string,
  membership: { id: string; role: StoredWorkspaceRole; removedAt: Date | null },
): WorkspaceRole | null {
  if (membership.removedAt) return null
  return membership.id === ownerWorkspaceMemberId ? "owner" : membership.role
}

export function workspaceCapabilities(role: WorkspaceRole): WorkspaceCapabilitiesDto {
  const isOwner = role === "owner"
  return {
    canManageDetails: isOwner,
    canManageSettings: isOwner,
    canManageMemberRoles: isOwner,
    canRemoveMembers: role !== "member",
    canTransferOwnership: isOwner,
    canInviteWorkspaceMembers: canInviteWorkspaceOutsiders(role),
  }
}

export function canChangeWorkspaceMemberRole(actorRole: WorkspaceRole, targetRole: WorkspaceRole) {
  return actorRole === "owner" && targetRole !== "owner"
}

export function canTransferWorkspaceOwnership(actorRole: WorkspaceRole) {
  return actorRole === "owner"
}

export function canInviteWorkspaceOutsiders(actorRole: WorkspaceRole | null) {
  return actorRole === "owner" || actorRole === "admin"
}

export function canRemoveWorkspaceMember(actorRole: WorkspaceRole, targetRole: WorkspaceRole, isSelf: boolean) {
  if (targetRole === "owner") return false
  if (isSelf) return true
  if (actorRole === "owner") return true
  return actorRole === "admin" && targetRole === "member"
}
