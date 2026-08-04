import "server-only"

import { getCurrentDatabaseUser } from "@/features/auth/server/session.service"
import {
  projectMemberIdSchema,
  projectMemberSchema,
  transferProjectOwnershipSchema,
  updateProjectMemberRoleSchema,
} from "@/features/members/member.schema"
import type { ProjectManagementDto, ProjectMemberDto } from "@/features/members/member.types"
import {
  deleteMemberAndUnassignTasks,
  findUserByEmail,
  insertProjectMember,
  listProjectMembers,
  transferOwnership,
  updateMemberRole,
} from "@/features/members/server/member.repository"
import { projectIdSchema } from "@/features/projects/project.schema"
import { getProjectById } from "@/features/projects/server/project.service"
import { ProjectAccessError, requireProjectPermission } from "@/features/projects/server/project-access.service"

export async function getProjectMembers(projectId: string): Promise<ProjectMemberDto[]> {
  const id = projectIdSchema.parse(projectId)
  await requireProjectPermission(id, "view")
  const members = await listProjectMembers(id)
  return members.map((member) => ({ ...member, createdAt: member.createdAt.toISOString() }))
}

export async function getProjectManagementData(projectId: string): Promise<ProjectManagementDto> {
  const id = projectIdSchema.parse(projectId)
  const access = await requireProjectPermission(id, "manage")
  const [project, members] = await Promise.all([getProjectById(id), getProjectMembers(id)])
  return { project, members, role: access.role }
}

export async function addProjectMember(projectId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const values = projectMemberSchema.parse(input)
  const currentUser = await getCurrentDatabaseUser()
  await requireProjectPermission(id, "manage")
  const user = await findUserByEmail(values.email)
  if (!user) throw new ProjectAccessError("No synchronized user exists for that email address", 422)

  const member = await insertProjectMember(id, currentUser.id, user.id, values)
  if (!member) {
    throw new ProjectAccessError("That user is already a project member or you cannot manage this project", 409)
  }
  return member
}

export async function updateProjectMemberRole(projectId: string, memberId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const parsedMemberId = projectMemberIdSchema.parse(memberId)
  const values = updateProjectMemberRoleSchema.parse(input)
  const currentUser = await getCurrentDatabaseUser()
  const member = await updateMemberRole(id, currentUser.id, parsedMemberId, values)
  if (!member) throw new ProjectAccessError("Project member not found or cannot be changed", 404)
  return member
}

export async function removeProjectMember(projectId: string, memberId: string) {
  const id = projectIdSchema.parse(projectId)
  const parsedMemberId = projectMemberIdSchema.parse(memberId)
  const currentUser = await getCurrentDatabaseUser()
  const member = await deleteMemberAndUnassignTasks(id, currentUser.id, parsedMemberId)
  if (!member) throw new ProjectAccessError("Project member not found or cannot be removed", 404)
}

export async function transferProjectOwnership(projectId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const values = transferProjectOwnershipSchema.parse(input)
  const currentUser = await getCurrentDatabaseUser()
  const project = await transferOwnership(id, currentUser.id, values)
  if (!project) throw new ProjectAccessError("The project owner or new owner could not be verified", 403)
}
