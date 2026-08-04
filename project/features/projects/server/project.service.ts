import "server-only"

import { getCurrentDatabaseUser } from "@/features/auth/server/session.service"
import {
  projectIdSchema,
  projectSchema,
  type UpdateProjectInput,
  updateProjectSchema,
} from "@/features/projects/project.schema"
import type { DashboardSummaryDto, ProjectDto, ProjectSummaryDto } from "@/features/projects/project.types"
import {
  deleteProjectAsOwner,
  findProjectById,
  getProjectCounts,
  insertProjectWithOwner,
  listAccessibleProjects,
  listProjectMemberUserIds,
  updateProjectAsManager,
} from "@/features/projects/server/project.repository"
import { ProjectAccessError, requireProjectPermission } from "@/features/projects/server/project-access.service"

function projectDto(project: {
  id: string
  name: string
  description: string | null
  dueDate: Date | null
  ownerId: string
  createdAt: Date
  updatedAt: Date
}): ProjectDto {
  return {
    ...project,
    dueDate: project.dueDate?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }
}

function normalizeProjectInput(input: UpdateProjectInput) {
  return { ...input, ...(input.description === "" ? { description: null } : {}) }
}

export async function getAccessibleProjectSummaries(limit?: number): Promise<ProjectSummaryDto[]> {
  const user = await getCurrentDatabaseUser()
  const memberships = await listAccessibleProjects(user.id, limit)
  return Promise.all(
    memberships.map(async (project) => ({
      ...project,
      dueDate: project.dueDate?.toISOString() ?? null,
      updatedAt: project.updatedAt.toISOString(),
      ...(await getProjectCounts(project.id)),
    })),
  )
}

export async function getDashboardSummary(): Promise<DashboardSummaryDto> {
  const accessibleProjects = await getAccessibleProjectSummaries()
  const memberRows = await listProjectMemberUserIds(accessibleProjects.map((project) => project.id))

  return {
    projectCount: accessibleProjects.length,
    memberCount: new Set(memberRows.map((member) => member.userId)).size,
    taskCount: accessibleProjects.reduce((total, project) => total + project.taskCount, 0),
    recentProjects: accessibleProjects.slice(0, 5),
  }
}

export async function getProjectById(projectId: string): Promise<ProjectDto> {
  const id = projectIdSchema.parse(projectId)
  await requireProjectPermission(id, "view")
  const project = await findProjectById(id)
  if (!project) throw new ProjectAccessError("Project not found", 404)
  return projectDto(project)
}

export async function createProject(input: unknown): Promise<ProjectDto> {
  const parsedValues = projectSchema.parse(input)
  const values = { ...parsedValues, ...(parsedValues.description === "" ? { description: null } : {}) }
  const owner = await getCurrentDatabaseUser()
  const project = await insertProjectWithOwner(owner.id, values)
  if (!project) throw new Error("Unable to create the project")
  return projectDto(project)
}

export async function updateProject(projectId: string, input: unknown): Promise<ProjectDto> {
  const id = projectIdSchema.parse(projectId)
  const values = normalizeProjectInput(updateProjectSchema.parse(input))
  if (Object.keys(values).length === 0) return getProjectById(id)

  const currentUser = await getCurrentDatabaseUser()
  const project = await updateProjectAsManager(id, currentUser.id, values)
  if (!project) {
    throw new ProjectAccessError("Project not found or you do not have permission to manage it", 404)
  }
  return projectDto(project)
}

export async function deleteProject(projectId: string) {
  const id = projectIdSchema.parse(projectId)
  const currentUser = await getCurrentDatabaseUser()
  const project = await deleteProjectAsOwner(id, currentUser.id)
  if (!project) {
    throw new ProjectAccessError("Project not found or you do not have permission to delete it", 404)
  }
}
