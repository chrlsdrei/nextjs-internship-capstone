import "server-only"

import { and, eq, sql } from "drizzle-orm"

import type {
  ProjectMemberInput,
  TransferProjectOwnershipInput,
  UpdateProjectMemberRoleInput,
} from "@/features/members/member.schema"
import { db } from "@/server/db/client"
import { projectMembers, users } from "@/server/db/schema"

function canManageProject(projectId: string, userId: string) {
  return sql`EXISTS (
    SELECT 1 FROM "project_members" AS "manager"
    WHERE "manager"."project_id" = ${projectId}
      AND "manager"."user_id" = ${userId}
      AND "manager"."role" IN ('owner', 'admin')
  )`
}

export async function findProjectAccess(projectId: string, userId: string) {
  const [membership] = await db
    .select({ projectId: projectMembers.projectId, role: projectMembers.role })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1)
  return membership ?? null
}

export function listProjectMembers(projectId: string) {
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
    .where(eq(projectMembers.projectId, projectId))
    .orderBy(projectMembers.createdAt)
}

export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(sql`lower(${users.email}) = ${email}`).limit(1)
  return user ?? null
}

export async function insertProjectMember(
  projectId: string,
  actorId: string,
  userId: string,
  values: ProjectMemberInput,
) {
  const { rows } = await db.execute<{ id: string }>(sql`
    INSERT INTO "project_members" ("project_id", "user_id", "role")
    SELECT ${projectId}, ${userId}, ${values.role}
    WHERE ${canManageProject(projectId, actorId)}
    ON CONFLICT ("project_id", "user_id") DO NOTHING
    RETURNING "id"
  `)
  return rows[0] ?? null
}

export async function updateMemberRole(
  projectId: string,
  actorId: string,
  memberId: string,
  values: UpdateProjectMemberRoleInput,
) {
  const { rows } = await db.execute<{ id: string }>(sql`
    UPDATE "project_members" AS "member"
    SET "role" = ${values.role}
    WHERE "member"."id" = ${memberId}
      AND "member"."project_id" = ${projectId}
      AND "member"."role" <> 'owner'
      AND ${canManageProject(projectId, actorId)}
    RETURNING "member"."id" AS "id"
  `)
  return rows[0] ?? null
}

export async function deleteMemberAndUnassignTasks(projectId: string, actorId: string, memberId: string) {
  const [, result] = await db.batch([
    db.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`project-write:${projectId}`}, 0))`),
    db.execute<{ userId: string }>(sql`
      WITH "removed_member" AS (
        DELETE FROM "project_members" AS "member"
        WHERE "member"."id" = ${memberId}
          AND "member"."project_id" = ${projectId}
          AND "member"."role" <> 'owner'
          AND ${canManageProject(projectId, actorId)}
        RETURNING "member"."user_id" AS "userId"
      ),
      "unassigned_tasks" AS (
        UPDATE "tasks"
        SET "assignee_id" = NULL
        WHERE "assignee_id" = (SELECT "userId" FROM "removed_member")
          AND "list_id" IN (SELECT "id" FROM "lists" WHERE "project_id" = ${projectId})
        RETURNING "id"
      )
      SELECT "userId" FROM "removed_member"
    `),
  ])
  return result.rows[0] ?? null
}

export async function transferOwnership(projectId: string, actorId: string, values: TransferProjectOwnershipInput) {
  const { rows } = await db.execute<{ id: string }>(sql`
    WITH "authorized_transfer" AS (
      SELECT "target"."user_id" AS "targetUserId"
      FROM "projects" AS "project"
      INNER JOIN "project_members" AS "current_member"
        ON "current_member"."project_id" = "project"."id"
        AND "current_member"."user_id" = ${actorId}
        AND "current_member"."role" = 'owner'
      INNER JOIN "project_members" AS "target"
        ON "target"."id" = ${values.memberId}
        AND "target"."project_id" = "project"."id"
        AND "target"."role" IN ('admin', 'member')
      WHERE "project"."id" = ${projectId}
        AND "project"."owner_id" = ${actorId}
      FOR UPDATE OF "project", "current_member", "target"
    ),
    "demoted_owner" AS (
      UPDATE "project_members" AS "current_member"
      SET "role" = 'admin'
      FROM "authorized_transfer"
      WHERE "current_member"."project_id" = ${projectId}
        AND "current_member"."user_id" = ${actorId}
        AND "current_member"."role" = 'owner'
      RETURNING "current_member"."id"
    ),
    "promoted_owner" AS (
      UPDATE "project_members" AS "target"
      SET "role" = 'owner'
      FROM "authorized_transfer", "demoted_owner"
      WHERE "target"."project_id" = ${projectId}
        AND "target"."user_id" = "authorized_transfer"."targetUserId"
        AND "target"."role" IN ('admin', 'member')
      RETURNING "target"."user_id" AS "userId"
    ),
    "updated_project" AS (
      UPDATE "projects" AS "project"
      SET "owner_id" = "promoted_owner"."userId"
      FROM "promoted_owner"
      WHERE "project"."id" = ${projectId}
        AND "project"."owner_id" = ${actorId}
      RETURNING "project"."id" AS "id"
    )
    SELECT "id" FROM "updated_project"
  `)
  return rows[0] ?? null
}
