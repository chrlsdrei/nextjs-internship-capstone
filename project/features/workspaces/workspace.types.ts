export type WorkspaceRole = "owner" | "admin" | "member"
export type StoredWorkspaceRole = Exclude<WorkspaceRole, "owner">
export type WorkspaceStatus = "active" | "suspended" | "deleted"

export type WorkspaceCapabilitiesDto = {
  canManageDetails: boolean
  canManageSettings: boolean
  canManageMemberRoles: boolean
  canRemoveMembers: boolean
  canTransferOwnership: boolean
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
}

export type WorkspaceDetailDto = WorkspaceSummaryDto & {
  capabilities: WorkspaceCapabilitiesDto
  members: WorkspaceMemberDto[]
}
