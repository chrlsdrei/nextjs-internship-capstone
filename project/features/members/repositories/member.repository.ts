import "server-only"

import { and, eq, isNotNull, isNull, or, sql } from "drizzle-orm"

import type { ProjectMemberInput, UpdateProjectMemberRoleInput } from "@/features/members/member.schema"
import type { BoardRole } from "@/features/projects/project.types"
import { db } from "@/server/db/client"
import { projectMembers, projects, users, workspaceMembers, workspaces } from "@/server/db/schema"

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

export async function findProjectAccess(projectId: string, userId: string) {
  const effectiveRole = sql<BoardRole>`CASE
    WHEN ${workspaces.ownerWorkspaceMemberId} = ${workspaceMembers.id} THEN 'board_admin'::board_role
    ELSE ${projectMembers.role}
  END`
  const [access] = await db
    .select({
      projectId: projects.id,
      workspaceId: projects.workspaceId,
      workspaceMemberId: workspaceMembers.id,
      projectMemberId: projectMembers.id,
      role: effectiveRole,
      isWorkspaceOwner: sql<boolean>`${workspaces.ownerWorkspaceMemberId} = ${workspaceMembers.id}`,
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
    .where(
      and(
        eq(projects.id, projectId),
        or(eq(workspaces.ownerWorkspaceMemberId, workspaceMembers.id), isNotNull(projectMembers.id)),
      ),
    )
    .limit(1)
  return access ?? null
}

export function listProjectMembers(projectId: string) {
  return db
    .select({
      id: projectMembers.id,
      userId: users.id,
      workspaceMemberId: workspaceMembers.id,
      email: users.email,
      name: users.name,
      role: projectMembers.role,
      createdAt: projectMembers.joinedAt,
    })
    .from(projectMembers)
    .innerJoin(workspaceMembers, eq(projectMembers.workspaceMemberId, workspaceMembers.id))
    .innerJoin(users, eq(workspaceMembers.userId, users.id))
    .where(and(eq(projectMembers.projectId, projectId), isNull(projectMembers.removedAt)))
    .orderBy(projectMembers.joinedAt)
}

export async function findWorkspaceOwnerForProject(projectId: string) {
  const [owner] = await db
    .select({
      workspaceMemberId: workspaceMembers.id,
      userId: users.id,
      email: users.email,
      name: users.name,
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      explicitProjectMemberId: projectMembers.id,
      explicitRole: projectMembers.role,
    })
    .from(projects)
    .innerJoin(workspaces, eq(workspaces.id, projects.workspaceId))
    .innerJoin(workspaceMembers, eq(workspaceMembers.id, workspaces.ownerWorkspaceMemberId))
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .leftJoin(
      projectMembers,
      and(
        eq(projectMembers.projectId, projects.id),
        eq(projectMembers.workspaceMemberId, workspaceMembers.id),
        isNull(projectMembers.removedAt),
      ),
    )
    .where(eq(projects.id, projectId))
    .limit(1)
  return owner ?? null
}

export async function findWorkspaceMemberByEmail(projectId: string, email: string) {
  const [member] = await db
    .select({ id: workspaceMembers.id, userId: workspaceMembers.userId, workspaceId: workspaceMembers.workspaceId })
    .from(projects)
    .innerJoin(
      workspaceMembers,
      and(eq(workspaceMembers.workspaceId, projects.workspaceId), isNull(workspaceMembers.removedAt)),
    )
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(and(eq(projects.id, projectId), eq(users.normalizedEmail, email)))
    .limit(1)
  return member ?? null
}

export async function insertProjectMember(
  projectId: string,
  actorUserId: string,
  workspaceMember: { id: string; workspaceId: string },
  values: ProjectMemberInput,
) {
  const { rows } = await db.execute<{ id: string }>(sql`
    INSERT INTO "project_members" ("workspace_id", "project_id", "workspace_member_id", "role")
    SELECT ${workspaceMember.workspaceId}, ${projectId}, ${workspaceMember.id}, ${values.role}
    WHERE ${canManageProject(projectId, actorUserId)}
      AND EXISTS (
        SELECT 1 FROM "projects"
        WHERE "id" = ${projectId} AND "workspace_id" = ${workspaceMember.workspaceId}
      )
    ON CONFLICT ("project_id", "workspace_member_id") WHERE "removed_at" IS NULL DO NOTHING
    RETURNING "id"
  `)
  return rows[0] ?? null
}

export async function updateMemberRole(
  projectId: string,
  actorUserId: string,
  memberId: string,
  values: UpdateProjectMemberRoleInput,
) {
  const { rows } = await db.execute<{ id: string }>(sql`
    UPDATE "project_members" AS "member"
    SET "role" = ${values.role}, "updated_at" = NOW()
    WHERE "member"."id" = ${memberId}
      AND "member"."project_id" = ${projectId}
      AND "member"."removed_at" IS NULL
      AND ${canManageProject(projectId, actorUserId)}
    RETURNING "member"."id" AS "id"
  `)
  return rows[0] ?? null
}

export async function softRemoveMemberAndUnassignTasks(projectId: string, actorUserId: string, memberId: string) {
  const [, result] = await db.batch([
    db.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`project-write:${projectId}`}, 0))`),
    db.execute<{ userId: string }>(sql`
      WITH "removed_member" AS (
        UPDATE "project_members" AS "member"
        SET "removed_at" = NOW(), "updated_at" = NOW()
        FROM "workspace_members" AS "workspace_member"
        WHERE "member"."id" = ${memberId}
          AND "member"."project_id" = ${projectId}
          AND "member"."removed_at" IS NULL
          AND "workspace_member"."id" = "member"."workspace_member_id"
          AND (
            ${canManageProject(projectId, actorUserId)}
            OR (
              "workspace_member"."user_id" = ${actorUserId}
              AND NOT EXISTS (
                SELECT 1
                FROM "projects" AS "leave_project"
                INNER JOIN "workspaces" AS "leave_workspace"
                  ON "leave_workspace"."id" = "leave_project"."workspace_id"
                WHERE "leave_project"."id" = ${projectId}
                  AND "leave_workspace"."owner_workspace_member_id" = "member"."workspace_member_id"
              )
            )
          )
        RETURNING "workspace_member"."user_id" AS "userId"
      ),
      "removed_assignments" AS (
        DELETE FROM "task_assignees" AS "assignment"
        WHERE "assignment"."project_id" = ${projectId}
          AND "assignment"."project_member_id" = ${memberId}
          AND EXISTS (SELECT 1 FROM "removed_member")
        RETURNING "assignment"."task_id"
      ), "assignment_activity" AS (
        INSERT INTO "activity_logs" (
          "workspace_id", "project_id", "task_id", "actor_workspace_member_id",
          "action", "schema_version", "metadata"
        )
        SELECT "project"."workspace_id", "project"."id", "task"."id", "actor_workspace_member"."id",
          'task.assignees_updated', 1,
          jsonb_build_object(
            'actorName', "actor_user"."name",
            'workspaceName', "workspace"."name",
            'projectTitle', "project"."title",
            'taskTitle', "task"."title",
            'assigneeNames', COALESCE((
              SELECT jsonb_agg("remaining_user"."name" ORDER BY "remaining_user"."name")
              FROM "task_assignees" AS "remaining_assignment"
              INNER JOIN "project_members" AS "remaining_project_member"
                ON "remaining_project_member"."id" = "remaining_assignment"."project_member_id"
              INNER JOIN "workspace_members" AS "remaining_workspace_member"
                ON "remaining_workspace_member"."id" = "remaining_project_member"."workspace_member_id"
              INNER JOIN "users" AS "remaining_user"
                ON "remaining_user"."id" = "remaining_workspace_member"."user_id"
              WHERE "remaining_assignment"."task_id" = "task"."id"
                AND "remaining_assignment"."project_member_id" <> ${memberId}
            ), '[]'::jsonb)
          )
        FROM "removed_assignments"
        INNER JOIN "tasks" AS "task" ON "task"."id" = "removed_assignments"."task_id"
        INNER JOIN "projects" AS "project" ON "project"."id" = "task"."project_id"
        INNER JOIN "workspaces" AS "workspace" ON "workspace"."id" = "project"."workspace_id"
        INNER JOIN "workspace_members" AS "actor_workspace_member"
          ON "actor_workspace_member"."workspace_id" = "project"."workspace_id"
          AND "actor_workspace_member"."user_id" = ${actorUserId}
          AND "actor_workspace_member"."removed_at" IS NULL
        INNER JOIN "users" AS "actor_user" ON "actor_user"."id" = ${actorUserId}
        RETURNING "task_id"
      )
      SELECT "userId" FROM "removed_member"
    `),
  ])
  return result.rows[0] ?? null
}
