import "server-only"

import { recordActivity } from "@/features/activity/server/activity.service"
import { getCurrentDatabaseUser } from "@/features/auth/server/session.service"
import { requireProjectCapacity, requireWorkspaceWritable } from "@/features/billing/server/entitlement.service"
import {
  projectIdSchema,
  projectSchema,
  type UpdateProjectInput,
  updateProjectSchema,
  updateProjectSettingsSchema,
} from "@/features/projects/project.schema"
import type { DashboardSummaryDto, ProjectDto, ProjectSummaryDto } from "@/features/projects/project.types"
import {
  deleteProjectAsManager,
  findProjectById,
  findProjectSettings,
  getProjectCounts,
  insertProject,
  listAccessibleProjects,
  listProjectMemberUserIds,
  updateProjectAsManager,
  updateProjectSettingsAsManager,
} from "@/features/projects/server/project.repository"
import { ProjectAccessError, requireProjectPermission } from "@/features/projects/server/project-access.service"
import { enforceRateLimit } from "@/features/rate-limits/server/rate-limit.service"
import { findActiveWorkspaceAccess } from "@/features/workspaces/server/workspace.repository"
import { resolveWorkspaceRole } from "@/features/workspaces/workspace.policy"

function projectDto(project: {
  id: string
  workspaceId: string
  title: string
  description: string | null
  dueDate: Date | null
  createdByWorkspaceMemberId: string
  createdAt: Date
  updatedAt: Date
}): ProjectDto {
  return {
    id: project.id,
    workspaceId: project.workspaceId,
    title: project.title,
    description: project.description,
    createdByWorkspaceMemberId: project.createdByWorkspaceMemberId,
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
  const creator = await getCurrentDatabaseUser()
  const workspaceAccess = await findActiveWorkspaceAccess(values.workspaceId, creator.id)
  if (workspaceAccess?.status !== "active") {
    throw new ProjectAccessError("Workspace not found or you cannot create projects there", 404)
  }
  const workspaceRole = resolveWorkspaceRole(workspaceAccess.ownerWorkspaceMemberId, {
    id: workspaceAccess.membershipId,
    role: workspaceAccess.membershipRole,
    removedAt: workspaceAccess.membershipRemovedAt,
  })
  const mayCreate =
    workspaceRole === "owner" ||
    workspaceRole === "admin" ||
    (workspaceRole === "member" && workspaceAccess.membersCanCreateProjects)
  if (!mayCreate) throw new ProjectAccessError("You cannot create projects in this workspace", 403)
  await requireProjectCapacity(values.workspaceId, creator.id)
  await enforceRateLimit({ action: "project.create", actorUserId: creator.id, workspaceId: values.workspaceId })

  const project = await insertProject(workspaceAccess.membershipId, workspaceRole === "owner", values)
  if (!project) throw new Error("Unable to create the project")
  await recordActivity({
    workspaceId: project.workspaceId,
    projectId: project.id,
    actorWorkspaceMemberId: workspaceAccess.membershipId,
    event: {
      action: "project.created",
      metadata: { actorName: creator.name, workspaceName: workspaceAccess.name, projectTitle: project.title },
    },
  })
  return projectDto(project)
}

export async function updateProject(projectId: string, input: unknown): Promise<ProjectDto> {
  const id = projectIdSchema.parse(projectId)
  const values = normalizeProjectInput(updateProjectSchema.parse(input))
  if (Object.keys(values).length === 0) return getProjectById(id)

  const access = await requireProjectPermission(id, "manage")
  await requireWorkspaceWritable(access.workspaceId, access.user.id)
  await enforceRateLimit({ action: "project.admin", actorUserId: access.user.id, workspaceId: access.workspaceId })
  const project = await updateProjectAsManager(id, access.user.id, values)
  if (!project) {
    throw new ProjectAccessError("Project not found or you do not have permission to manage it", 404)
  }
  const workspaceAccess = await findActiveWorkspaceAccess(access.workspaceId, access.user.id)
  if (!workspaceAccess) throw new ProjectAccessError("Workspace access not found", 404)
  await recordActivity({
    workspaceId: access.workspaceId,
    projectId: project.id,
    actorWorkspaceMemberId: access.workspaceMemberId,
    event: {
      action: "project.updated",
      metadata: { actorName: access.user.name, workspaceName: workspaceAccess.name, projectTitle: project.title },
    },
  })
  return projectDto(project)
}

export async function deleteProject(projectId: string) {
  const id = projectIdSchema.parse(projectId)
  const access = await requireProjectPermission(id, "delete")
  const projectSnapshot = await findProjectById(id)
  const workspaceAccess = await findActiveWorkspaceAccess(access.workspaceId, access.user.id)
  if (!projectSnapshot || !workspaceAccess) throw new ProjectAccessError("Project not found", 404)
  await enforceRateLimit({ action: "project.admin", actorUserId: access.user.id, workspaceId: access.workspaceId })
  const project = await deleteProjectAsManager(id, access.user.id)
  if (!project) {
    throw new ProjectAccessError("Project not found or you do not have permission to delete it", 404)
  }
  await recordActivity({
    workspaceId: access.workspaceId,
    projectId: null,
    actorWorkspaceMemberId: access.workspaceMemberId,
    event: {
      action: "project.deleted",
      metadata: {
        actorName: access.user.name,
        workspaceName: workspaceAccess.name,
        projectTitle: projectSnapshot.title,
      },
    },
  })
}

export async function getProjectSettings(projectId: string) {
  const id = projectIdSchema.parse(projectId)
  await requireProjectPermission(id, "view")
  const settings = await findProjectSettings(id)
  if (!settings) throw new ProjectAccessError("Project settings not found", 404)
  return settings
}

export async function updateProjectSettings(projectId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const values = updateProjectSettingsSchema.parse(input)
  const access = await requireProjectPermission(id, "manage")
  await requireWorkspaceWritable(access.workspaceId, access.user.id)
  await enforceRateLimit({ action: "project.admin", actorUserId: access.user.id, workspaceId: access.workspaceId })
  const settings = await updateProjectSettingsAsManager(id, access.user.id, values)
  if (!settings) {
    throw new ProjectAccessError("Project settings not found or you cannot manage them", 404)
  }
  const project = await findProjectById(id)
  const workspaceAccess = await findActiveWorkspaceAccess(access.workspaceId, access.user.id)
  if (!project || !workspaceAccess) throw new ProjectAccessError("Project not found", 404)
  await recordActivity({
    workspaceId: access.workspaceId,
    projectId: id,
    actorWorkspaceMemberId: access.workspaceMemberId,
    event: {
      action: "project.settings_updated",
      metadata: {
        actorName: access.user.name,
        workspaceName: workspaceAccess.name,
        projectTitle: project.title,
        editorsCanAssignTasks: settings.editorsCanAssignTasks,
      },
    },
  })
  return settings
}
