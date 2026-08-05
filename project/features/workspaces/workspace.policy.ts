import type { StoredWorkspaceRole, WorkspaceCapabilitiesDto, WorkspaceRole } from "./workspace.types"

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
  }
}

export function canChangeWorkspaceMemberRole(actorRole: WorkspaceRole, targetRole: WorkspaceRole) {
  return actorRole === "owner" && targetRole !== "owner"
}

export function canTransferWorkspaceOwnership(actorRole: WorkspaceRole) {
  return actorRole === "owner"
}

export function canRemoveWorkspaceMember(actorRole: WorkspaceRole, targetRole: WorkspaceRole, isSelf: boolean) {
  if (targetRole === "owner") return false
  if (isSelf) return true
  if (actorRole === "owner") return true
  return actorRole === "admin" && targetRole === "member"
}
