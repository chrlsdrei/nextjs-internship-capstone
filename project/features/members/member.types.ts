import type { ProjectDto, ProjectRole } from "@/features/projects/project.types"

export type ProjectMemberDto = {
  id: string
  userId: string
  email: string
  name: string
  role: ProjectRole
  createdAt: string
}

export type ProjectManagementDto = {
  project: ProjectDto
  members: ProjectMemberDto[]
  role: ProjectRole
}
