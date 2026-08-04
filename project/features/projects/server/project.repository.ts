import "server-only"

import { randomUUID } from "node:crypto"

import { and, count, desc, eq, inArray, sql } from "drizzle-orm"

import type { CreateProjectInput, UpdateProjectInput } from "@/features/projects/project.schema"
import { db } from "@/server/db/client"
import { lists, projectMembers, projects, tasks } from "@/server/db/schema"

function canManageProject(projectId: string, userId: string) {
  return sql`EXISTS (
    SELECT 1 FROM "project_members" AS "manager"
    WHERE "manager"."project_id" = ${projectId}
      AND "manager"."user_id" = ${userId}
      AND "manager"."role" IN ('owner', 'admin')
  )`
}

function canOwnProject(projectId: string, userId: string) {
  return sql`EXISTS (
    SELECT 1 FROM "project_members" AS "owner_membership"
    WHERE "owner_membership"."project_id" = ${projectId}
      AND "owner_membership"."user_id" = ${userId}
      AND "owner_membership"."role" = 'owner'
  )`
}

export async function listAccessibleProjects(userId: string, limit?: number) {
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
    .where(eq(projectMembers.userId, userId))
    .orderBy(desc(projects.updatedAt))

  return limit === undefined ? query : query.limit(limit)
}

export async function getProjectCounts(projectId: string) {
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

export async function listProjectMemberUserIds(projectIds: string[]) {
  if (projectIds.length === 0) return []
  return db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(inArray(projectMembers.projectId, projectIds))
}

export async function findProjectById(projectId: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  return project ?? null
}

export async function insertProjectWithOwner(ownerId: string, values: CreateProjectInput) {
  const projectId = randomUUID()
  const [[project]] = await db.batch([
    db
      .insert(projects)
      .values({ id: projectId, ...values, ownerId })
      .returning(),
    db
      .insert(projectMembers)
      .values({ projectId, userId: ownerId, role: "owner" })
      .returning({ id: projectMembers.id }),
  ])
  return project ?? null
}

export async function updateProjectAsManager(projectId: string, userId: string, values: UpdateProjectInput) {
  const [project] = await db
    .update(projects)
    .set(values)
    .where(and(eq(projects.id, projectId), canManageProject(projectId, userId)))
    .returning()
  return project ?? null
}

export async function deleteProjectAsOwner(projectId: string, userId: string) {
  const [project] = await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId), canOwnProject(projectId, userId)))
    .returning({ id: projects.id })
  return project ?? null
}
