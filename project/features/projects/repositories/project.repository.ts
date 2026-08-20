import "server-only"

import { randomUUID } from "node:crypto"

import { and, count, desc, eq, inArray, isNotNull, isNull, or, sql } from "drizzle-orm"

import type {
  CreateProjectInput,
  UpdateProjectInput,
  UpdateProjectSettingsInput,
} from "@/features/projects/project.schema"
import type { BoardRole } from "@/features/projects/project.types"
import { db } from "@/server/db/client"
import { projectMembers, projectSettings, projects, tasks, workspaceMembers, workspaces } from "@/server/db/schema"

function canManageProject(projectId: string, userId: string) {
  return sql`EXISTS (
    SELECT 1
    FROM "projects" AS "authorized_project"
    INNER JOIN "workspaces" AS "authorized_workspace"
      ON "authorized_workspace"."id" = "authorized_project"."workspace_id"
      AND "authorized_workspace"."status" = 'active'
    INNER JOIN "workspace_members" AS "actor_workspace_member"
      ON "actor_workspace_member"."workspace_id" = "authorized_project"."workspace_id"
      AND "actor_workspace_member"."user_id" = ${userId}
      AND "actor_workspace_member"."removed_at" IS NULL
    LEFT JOIN "project_members" AS "actor_project_member"
      ON "actor_project_member"."project_id" = "authorized_project"."id"
      AND "actor_project_member"."workspace_member_id" = "actor_workspace_member"."id"
      AND "actor_project_member"."removed_at" IS NULL
    WHERE "authorized_project"."id" = ${projectId}
      AND (
        "authorized_workspace"."owner_workspace_member_id" = "actor_workspace_member"."id"
        OR "actor_project_member"."role" = 'board_admin'
      )
  )`
}

export async function listAccessibleProjects(userId: string, limit?: number) {
  const effectiveRole = sql<BoardRole>`CASE
    WHEN ${workspaces.ownerWorkspaceMemberId} = ${workspaceMembers.id} THEN 'board_admin'::board_role
    ELSE ${projectMembers.role}
  END`
  const query = db
    .select({
      id: projects.id,
      workspaceId: projects.workspaceId,
      title: projects.title,
      description: projects.description,
      dueDate: projects.dueDate,
      updatedAt: projects.updatedAt,
      role: effectiveRole,
    })
    .from(projects)
    .innerJoin(workspaces, and(eq(workspaces.id, projects.workspaceId), eq(workspaces.status, "active")))
    .innerJoin(
      workspaceMembers,
      and(
        eq(workspaceMembers.workspaceId, projects.workspaceId),
        eq(workspaceMembers.userId, userId),
        isNull(workspaceMembers.removedAt),
      ),
    )
    .leftJoin(
      projectMembers,
      and(
        eq(projectMembers.projectId, projects.id),
        eq(projectMembers.workspaceMemberId, workspaceMembers.id),
        isNull(projectMembers.removedAt),
      ),
    )
    .where(or(eq(workspaces.ownerWorkspaceMemberId, workspaceMembers.id), isNotNull(projectMembers.id)))
    .orderBy(desc(projects.updatedAt))

  const rows = limit === undefined ? await query : await query.limit(limit)
  return rows
}

export async function getProjectCounts(projectId: string) {
  const [[explicitMemberCount], [project], [taskCount]] = await Promise.all([
    db
      .select({ count: count() })
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), isNull(projectMembers.removedAt))),
    db
      .select({ ownerWorkspaceMemberId: workspaces.ownerWorkspaceMemberId })
      .from(projects)
      .innerJoin(workspaces, eq(workspaces.id, projects.workspaceId))
      .where(eq(projects.id, projectId))
      .limit(1),
    db.select({ count: count() }).from(tasks).where(eq(tasks.projectId, projectId)),
  ])
  const [ownerMembership] = project
    ? await db
        .select({ id: projectMembers.id })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, projectId),
            eq(projectMembers.workspaceMemberId, project.ownerWorkspaceMemberId),
            isNull(projectMembers.removedAt),
          ),
        )
        .limit(1)
    : []

  return {
    memberCount: (explicitMemberCount?.count ?? 0) + (project && !ownerMembership ? 1 : 0),
    taskCount: taskCount?.count ?? 0,
  }
}

export async function listProjectMemberUserIds(projectIds: string[]) {
  if (projectIds.length === 0) return []
  const [explicitMembers, workspaceOwners] = await Promise.all([
    db
      .select({ userId: workspaceMembers.userId })
      .from(projectMembers)
      .innerJoin(workspaceMembers, eq(workspaceMembers.id, projectMembers.workspaceMemberId))
      .where(and(inArray(projectMembers.projectId, projectIds), isNull(projectMembers.removedAt))),
    db
      .select({ userId: workspaceMembers.userId })
      .from(projects)
      .innerJoin(workspaces, eq(workspaces.id, projects.workspaceId))
      .innerJoin(workspaceMembers, eq(workspaceMembers.id, workspaces.ownerWorkspaceMemberId))
      .where(inArray(projects.id, projectIds)),
  ])
  return [...explicitMembers, ...workspaceOwners]
}

export async function findProjectById(projectId: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  return project ?? null
}

export async function insertProject(
  creatorWorkspaceMemberId: string,
  creatorIsWorkspaceOwner: boolean,
  values: CreateProjectInput,
) {
  const projectId = randomUUID()
  const projectValues = {
    id: projectId,
    workspaceId: values.workspaceId,
    title: values.title,
    description: values.description,
    dueDate: values.dueDate,
    createdByWorkspaceMemberId: creatorWorkspaceMemberId,
  }

  if (creatorIsWorkspaceOwner) {
    const [[project]] = await db.batch([
      db.insert(projects).values(projectValues).returning(),
      db.insert(projectSettings).values({ projectId }).returning({ projectId: projectSettings.projectId }),
    ])
    return project ?? null
  }

  const [[project]] = await db.batch([
    db.insert(projects).values(projectValues).returning(),
    db.insert(projectSettings).values({ projectId }).returning({ projectId: projectSettings.projectId }),
    db
      .insert(projectMembers)
      .values({
        projectId,
        workspaceId: values.workspaceId,
        workspaceMemberId: creatorWorkspaceMemberId,
        role: "board_admin",
      })
      .returning({ id: projectMembers.id }),
  ])
  return project ?? null
}

export async function updateProjectAsManager(projectId: string, userId: string, values: UpdateProjectInput) {
  const [project] = await db
    .update(projects)
    .set({
      ...(values.title === undefined ? {} : { title: values.title }),
      ...(values.description === undefined ? {} : { description: values.description }),
      ...(values.dueDate === undefined ? {} : { dueDate: values.dueDate }),
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, projectId), canManageProject(projectId, userId)))
    .returning()
  return project ?? null
}

export async function findProjectSettings(projectId: string) {
  const [settings] = await db
    .select({ editorsCanAssignTasks: projectSettings.editorsCanAssignTasks })
    .from(projectSettings)
    .where(eq(projectSettings.projectId, projectId))
    .limit(1)
  return settings ?? null
}

export async function updateProjectSettingsAsManager(
  projectId: string,
  userId: string,
  values: UpdateProjectSettingsInput,
) {
  const [settings] = await db
    .update(projectSettings)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(projectSettings.projectId, projectId), canManageProject(projectId, userId)))
    .returning({ editorsCanAssignTasks: projectSettings.editorsCanAssignTasks })
  return settings ?? null
}

export async function deleteProjectAsManager(projectId: string, userId: string) {
  const [project] = await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), canManageProject(projectId, userId)))
    .returning({ id: projects.id })
  return project ?? null
}
