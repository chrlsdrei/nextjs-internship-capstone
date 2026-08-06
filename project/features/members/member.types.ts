import type {
  BoardRole,
  ProjectDto,
  ProjectManagementCapabilitiesDto,
  ProjectSettingsDto,
} from "@/features/projects/project.types"

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
  workspace: {
    id: string
    name: string
  }
  settings: ProjectSettingsDto
  capabilities: ProjectManagementCapabilitiesDto
  members: ProjectMemberDto[]
  workspaceOwner: {
    userId: string
    workspaceMemberId: string
    email: string
    name: string
    explicitProjectMemberId: string | null
    explicitRole: BoardRole | null
  }
  role: BoardRole
}
