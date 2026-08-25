export type WorkspaceRole = "owner" | "admin" | "member"
export type StoredWorkspaceRole = Exclude<WorkspaceRole, "owner">
export type WorkspaceStatus = "active" | "suspended" | "deleted"

export type WorkspaceCapabilitiesDto = {
  canManageDetails: boolean
  canManageSettings: boolean
  canManageMemberRoles: boolean
  canRemoveMembers: boolean
  canTransferOwnership: boolean
  canInviteWorkspaceMembers: boolean
  canLeaveWorkspace: boolean
}

export type WorkspaceSummaryDto = {
  id: string
  name: string
  description: string | null
  status: WorkspaceStatus
  role: WorkspaceRole
  memberCount: number
  membersCanCreateProjects: boolean
  createdAt: string
  updatedAt: string
}

export type WorkspaceMemberDto = {
  id: string
  userId: string
  name: string
  email: string
  role: WorkspaceRole
  joinedAt: string
  lastSeenAt: string | null
  isCurrentUser: boolean
  capabilities: {
    canChangeRole: boolean
    canRemove: boolean
    canReceiveOwnership: boolean
  }
}

export type WorkspaceDetailDto = WorkspaceSummaryDto & {
  capabilities: WorkspaceCapabilitiesDto
  members: WorkspaceMemberDto[]
}
