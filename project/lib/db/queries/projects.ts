import "server-only"

import { randomUUID } from "node:crypto"

import { and, count, desc, eq, sql } from "drizzle-orm"

import { getCurrentDatabaseUser } from "@/lib/auth"
import { executeProjectLockedWrite, ProjectAccessError, requireProjectPermission } from "@/lib/project-access"
import {
  type ProjectMemberInput,
  projectIdSchema,
  projectMemberIdSchema,
  projectMemberSchema,
  projectSchema,
  type TransferProjectOwnershipInput,
  transferProjectOwnershipSchema,
  type UpdateProjectInput,
  type UpdateProjectMemberRoleInput,
  updateProjectMemberRoleSchema,
  updateProjectSchema,
} from "@/lib/validations"

import { db } from "../index"
import { lists, projectMembers, projects, tasks, users } from "../schema"

export type ProjectSummary = {
  id: string
  name: string
  description: string | null
  dueDate: Date | null
  updatedAt: Date
  role: "owner" | "admin" | "member"
  memberCount: number
  taskCount: number
}

function normalizeProjectInput(input: UpdateProjectInput) {
  return {
    ...input,
    ...(input.description === "" ? { description: null } : {}),
  }
}

function canManageProject(projectId: string, userId: string) {
  return sql`EXISTS (
    SELECT 1
    FROM "project_members" AS "manager"
    WHERE "manager"."project_id" = ${projectId}
      AND "manager"."user_id" = ${userId}
      AND "manager"."role" IN ('owner', 'admin')
  )`
}

function canOwnProject(projectId: string, userId: string) {
  return sql`EXISTS (
    SELECT 1
    FROM "project_members" AS "owner_membership"
    WHERE "owner_membership"."project_id" = ${projectId}
      AND "owner_membership"."user_id" = ${userId}
      AND "owner_membership"."role" = 'owner'
  )`
}

function parseProjectId(projectId: string) {
  return projectIdSchema.parse(projectId)
}

function parseProjectMemberId(memberId: string) {
  return projectMemberIdSchema.parse(memberId)
}

async function getProjectCounts(projectId: string) {
  const [[memberCount], [taskCount]] = await Promise.all([
    db.select({ count: count() }).from(projectMembers).where(eq(projectMembers.projectId, projectId)),
    db
      .select({ count: count() })
      .from(tasks)
      .innerJoin(lists, eq(tasks.listId, lists.id))
      .where(eq(lists.projectId, projectId)),
  ])

  return { memberCount: memberCount?.count ?? 0, taskCount: taskCount?.count ?? 0 }
}

export async function getAccessibleProjectSummaries(limit?: number): Promise<ProjectSummary[]> {
  const user = await getCurrentDatabaseUser()
  const query = db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      dueDate: projects.dueDate,
      updatedAt: projects.updatedAt,
      role: projectMembers.role,
    })
    .from(projectMembers)
    .innerJoin(projects, eq(projectMembers.projectId, projects.id))
    .where(eq(projectMembers.userId, user.id))
    .orderBy(desc(projects.updatedAt))

  const memberships = limit === undefined ? await query : await query.limit(limit)
  return Promise.all(
    memberships.map(async (project) => ({
      ...project,
      ...(await getProjectCounts(project.id)),
    })),
  )
}

export async function getDashboardSummary() {
  const projects = await getAccessibleProjectSummaries()
  const memberRows = await Promise.all(
    projects.map((project) =>
      db.select({ userId: projectMembers.userId }).from(projectMembers).where(eq(projectMembers.projectId, project.id)),
    ),
  )
  const totalMembers = new Set(memberRows.flat().map((member) => member.userId)).size

  return {
    projectCount: projects.length,
    memberCount: totalMembers,
    taskCount: projects.reduce((total, project) => total + project.taskCount, 0),
    recentProjects: projects.slice(0, 5),
  }
}

export async function getProjectById(projectId: string) {
  const id = parseProjectId(projectId)
  await requireProjectPermission(id, "view")
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
  if (!project) {
    throw new ProjectAccessError("Project not found", 404)
  }

  return project
}

export async function getProjectMembers(projectId: string) {
  const id = parseProjectId(projectId)
  await requireProjectPermission(id, "view")
  return db
    .select({
      id: projectMembers.id,
      userId: users.id,
      email: users.email,
      name: users.name,
      role: projectMembers.role,
      createdAt: projectMembers.createdAt,
    })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, id))
    .orderBy(projectMembers.createdAt)
}

export async function getProjectManagementData(projectId: string) {
  const id = parseProjectId(projectId)
  const access = await requireProjectPermission(id, "manage")
  const [project, members] = await Promise.all([getProjectById(id), getProjectMembers(id)])
  return { project, members, role: access.role }
}

export async function createProject(input: unknown) {
  const parsedValues = projectSchema.parse(input)
  const values = {
    ...parsedValues,
    ...(parsedValues.description === "" ? { description: null } : {}),
  }
  const owner = await getCurrentDatabaseUser()
  const projectId = randomUUID()

  const [[project]] = await db.batch([
    db
      .insert(projects)
      .values({ id: projectId, ...values, ownerId: owner.id })
      .returning(),
    db
      .insert(projectMembers)
      .values({ projectId, userId: owner.id, role: "owner" })
      .returning({ id: projectMembers.id }),
  ])
  if (!project) {
    throw new Error("Unable to create the project")
  }

  return project
}

export async function updateProject(projectId: string, input: unknown) {
  const id = parseProjectId(projectId)
  const values = normalizeProjectInput(updateProjectSchema.parse(input))
  if (Object.keys(values).length === 0) {
    await requireProjectPermission(id, "manage")
    return getProjectById(id)
  }
  const currentUser = await getCurrentDatabaseUser()

  const [project] = await db
    .update(projects)
    .set(values)
    .where(and(eq(projects.id, id), canManageProject(id, currentUser.id)))
    .returning()
  if (!project) {
    throw new ProjectAccessError("Project not found or you do not have permission to manage it", 404)
  }

  return project
}

export async function deleteProject(projectId: string) {
  const id = parseProjectId(projectId)
  const currentUser = await getCurrentDatabaseUser()
  const [project] = await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.ownerId, currentUser.id), canOwnProject(id, currentUser.id)))
    .returning({ id: projects.id })
  if (!project) {
    throw new ProjectAccessError("Project not found or you do not have permission to delete it", 404)
  }
}

export async function addProjectMember(projectId: string, input: unknown) {
  const id = parseProjectId(projectId)
  const values: ProjectMemberInput = projectMemberSchema.parse(input)
  const currentUser = await getCurrentDatabaseUser()
  await requireProjectPermission(id, "manage")
  const [user] = await db.select().from(users).where(sql`lower(${users.email}) = ${values.email}`).limit(1)
  if (!user) {
    throw new ProjectAccessError("No synchronized user exists for that email address", 422)
  }

  const { rows } = await db.execute<{ id: string }>(sql`
    INSERT INTO "project_members" ("project_id", "user_id", "role")
    SELECT ${id}, ${user.id}, ${values.role}
    WHERE ${canManageProject(id, currentUser.id)}
    ON CONFLICT ("project_id", "user_id") DO NOTHING
    RETURNING "id"
  `)
  const [member] = rows
  if (!member) {
    throw new ProjectAccessError("That user is already a project member or you cannot manage this project", 409)
  }

  return member
}

export async function updateProjectMemberRole(projectId: string, memberId: string, input: unknown) {
  const id = parseProjectId(projectId)
  const memberIdValue = parseProjectMemberId(memberId)
  const values: UpdateProjectMemberRoleInput = updateProjectMemberRoleSchema.parse(input)
  const currentUser = await getCurrentDatabaseUser()
  const { rows } = await db.execute<{ id: string }>(sql`
    UPDATE "project_members" AS "member"
    SET "role" = ${values.role}
    WHERE "member"."id" = ${memberIdValue}
      AND "member"."project_id" = ${id}
      AND "member"."role" <> 'owner'
      AND ${canManageProject(id, currentUser.id)}
    RETURNING "member"."id" AS "id"
  `)
  const [member] = rows
  if (!member) {
    throw new ProjectAccessError("Project member not found or cannot be changed", 404)
  }

  return member
}

export async function removeProjectMember(projectId: string, memberId: string) {
  const id = parseProjectId(projectId)
  const memberIdValue = parseProjectMemberId(memberId)
  const currentUser = await getCurrentDatabaseUser()
  const rows = await executeProjectLockedWrite<{ userId: string }>(
    id,
    sql`
    WITH "removed_member" AS (
      DELETE FROM "project_members" AS "member"
      WHERE "member"."id" = ${memberIdValue}
        AND "member"."project_id" = ${id}
        AND "member"."role" <> 'owner'
        AND ${canManageProject(id, currentUser.id)}
      RETURNING "member"."user_id" AS "userId"
    ),
    "unassigned_tasks" AS (
      UPDATE "tasks"
      SET "assignee_id" = NULL
      WHERE "assignee_id" = (SELECT "userId" FROM "removed_member")
        AND "list_id" IN (SELECT "id" FROM "lists" WHERE "project_id" = ${id})
      RETURNING "id"
    )
    SELECT "userId" FROM "removed_member"
  `,
  )
  if (!rows[0]) {
    throw new ProjectAccessError("Project member not found or cannot be removed", 404)
  }
}

export async function transferProjectOwnership(projectId: string, input: unknown) {
  const id = parseProjectId(projectId)
  const values: TransferProjectOwnershipInput = transferProjectOwnershipSchema.parse(input)
  const currentUser = await getCurrentDatabaseUser()

  const { rows } = await db.execute<{ id: string }>(sql`
    WITH "authorized_transfer" AS (
      SELECT "target"."user_id" AS "targetUserId"
      FROM "projects" AS "project"
      INNER JOIN "project_members" AS "current_member"
        ON "current_member"."project_id" = "project"."id"
        AND "current_member"."user_id" = ${currentUser.id}
        AND "current_member"."role" = 'owner'
      INNER JOIN "project_members" AS "target"
        ON "target"."id" = ${values.memberId}
        AND "target"."project_id" = "project"."id"
        AND "target"."role" IN ('admin', 'member')
      WHERE "project"."id" = ${id}
        AND "project"."owner_id" = ${currentUser.id}
      FOR UPDATE OF "project", "current_member", "target"
    ),
    "demoted_owner" AS (
      UPDATE "project_members" AS "current_member"
      SET "role" = 'admin'
      FROM "authorized_transfer"
      WHERE "current_member"."project_id" = ${id}
        AND "current_member"."user_id" = ${currentUser.id}
        AND "current_member"."role" = 'owner'
      RETURNING "current_member"."id"
    ),
    "promoted_owner" AS (
      UPDATE "project_members" AS "target"
      SET "role" = 'owner'
      FROM "authorized_transfer", "demoted_owner"
      WHERE "target"."project_id" = ${id}
        AND "target"."user_id" = "authorized_transfer"."targetUserId"
        AND "target"."role" IN ('admin', 'member')
      RETURNING "target"."user_id" AS "userId"
    ),
    "updated_project" AS (
      UPDATE "projects" AS "project"
      SET "owner_id" = "promoted_owner"."userId"
      FROM "promoted_owner"
      WHERE "project"."id" = ${id}
        AND "project"."owner_id" = ${currentUser.id}
      RETURNING "project"."id" AS "id"
    )
    SELECT "id" FROM "updated_project"
  `)
  if (!rows[0]) {
    throw new ProjectAccessError("The project owner or new owner could not be verified", 403)
  }
}
