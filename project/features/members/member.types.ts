import type { BoardRole, ProjectDto } from "@/features/projects/project.types"

export type ProjectMemberDto = {
  id: string
  userId: string
  workspaceMemberId: string
  email: string
  name: string
  role: BoardRole
  createdAt: string
}

export type ProjectManagementDto = {
  project: ProjectDto
  members: ProjectMemberDto[]
  workspaceOwner: {
    userId: string
    workspaceMemberId: string
    email: string
    name: string
  }
  role: BoardRole
}
