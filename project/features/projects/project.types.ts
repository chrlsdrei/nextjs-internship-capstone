export type BoardRole = "board_admin" | "editor" | "viewer"

export type ProjectSummaryDto = {
  id: string
  workspaceId: string
  name: string
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
  name: string
  description: string | null
  dueDate: string | null
  createdByWorkspaceMemberId: string
  createdAt: string
  updatedAt: string
}

export type DashboardSummaryDto = {
  projectCount: number
  memberCount: number
  taskCount: number
  recentProjects: ProjectSummaryDto[]
}
