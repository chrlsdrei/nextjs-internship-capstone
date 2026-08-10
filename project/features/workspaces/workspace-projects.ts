import type { ProjectSummaryDto } from "@/features/projects/project.types"
import type { WorkspaceSummaryDto } from "@/features/workspaces/workspace.types"

export type WorkspaceProjectGroupDto = {
  key: string
  name: string
  workspace: WorkspaceSummaryDto | null
  projects: ProjectSummaryDto[]
}

export function groupProjectsByWorkspace(
  workspaces: WorkspaceSummaryDto[],
  projects: ProjectSummaryDto[],
  includeEmptyWorkspaces = false,
): WorkspaceProjectGroupDto[] {
  const projectsByWorkspace = new Map<string, ProjectSummaryDto[]>()
  const unassignedProjects: ProjectSummaryDto[] = []

  for (const project of projects) {
    if (!project.workspaceId || !workspaces.some((workspace) => workspace.id === project.workspaceId)) {
      unassignedProjects.push(project)
      continue
    }
    const workspaceProjects = projectsByWorkspace.get(project.workspaceId) ?? []
    workspaceProjects.push(project)
    projectsByWorkspace.set(project.workspaceId, workspaceProjects)
  }

  const groups: WorkspaceProjectGroupDto[] = workspaces
    .map((workspace) => ({
      key: workspace.id,
      name: workspace.name,
      workspace,
      projects: projectsByWorkspace.get(workspace.id) ?? [],
    }))
    .filter((group) => includeEmptyWorkspaces || group.projects.length > 0)

  if (unassignedProjects.length > 0) {
    groups.push({ key: "unassigned", name: "Unavailable workspace", workspace: null, projects: unassignedProjects })
  }

  return groups
}
