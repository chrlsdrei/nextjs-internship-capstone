export type BoardRole = "board_admin" | "editor" | "viewer"

export type ProjectSummaryDto = {
  id: string
  workspaceId: string
  title: string
  description: string | null
  dueDate: string | null
  updatedAt: string
  role: BoardRole
  memberCount: number
  taskCount: number
}

export type ProjectDto = {
  id: string
  workspaceId: string
  title: string
  description: string | null
  dueDate: string | null
  createdByWorkspaceMemberId: string
  createdAt: string
  updatedAt: string
}

export type ProjectSettingsDto = {
  editorsCanAssignTasks: boolean
}

export type ProjectManagementCapabilitiesDto = {
  canManageDetails: boolean
  canManageMembers: boolean
  canManageBoardRules: boolean
  canDeleteProject: boolean
}

export type DashboardSummaryDto = {
  projectCount: number
  memberCount: number
  taskCount: number
  recentProjects: ProjectSummaryDto[]
}
