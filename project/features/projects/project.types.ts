export type ProjectRole = "owner" | "admin" | "member"

export type ProjectSummaryDto = {
  id: string
  workspaceId: string | null
  name: string
  description: string | null
  dueDate: string | null
  updatedAt: string
  role: ProjectRole
  memberCount: number
  taskCount: number
}

export type ProjectDto = {
  id: string
  name: string
  description: string | null
  dueDate: string | null
  ownerId: string
  createdAt: string
  updatedAt: string
}

export type DashboardSummaryDto = {
  projectCount: number
  memberCount: number
  taskCount: number
  recentProjects: ProjectSummaryDto[]
}
