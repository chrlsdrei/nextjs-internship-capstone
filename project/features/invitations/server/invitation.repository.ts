import "server-only"

import { and, desc, eq, isNull, sql } from "drizzle-orm"

import type {
  InvitationBoardRole,
  InvitationKind,
  InvitationWorkspaceRole,
} from "@/features/invitations/invitation.types"
import { db } from "@/server/db/client"
import { projectMembers, projects, users, workspaceInvitations, workspaceMembers, workspaces } from "@/server/db/schema"

export type NewInvitationRecord = {
  kind: InvitationKind
  workspaceId: string
  projectId: string | null
  invitedByWorkspaceMemberId: string
  email: string
  normalizedEmail: string
  workspaceRole: InvitationWorkspaceRole | null
  boardRole: InvitationBoardRole | null
  tokenHash: string
  expiresAt: Date
}

const invitationSelection = {
  id: workspaceInvitations.id,
  kind: workspaceInvitations.kind,
  workspaceId: workspaceInvitations.workspaceId,
  workspaceName: workspaces.name,
  projectId: workspaceInvitations.projectId,
  projectTitle: projects.title,
  email: workspaceInvitations.email,
  normalizedEmail: workspaceInvitations.normalizedEmail,
  workspaceRole: workspaceInvitations.workspaceRole,
  boardRole: workspaceInvitations.boardRole,
  tokenHash: workspaceInvitations.tokenHash,
  deliveryStatus: workspaceInvitations.deliveryStatus,
  deliveryAttempt: workspaceInvitations.deliveryAttempt,
  expiresAt: workspaceInvitations.expiresAt,
  acceptedAt: workspaceInvitations.acceptedAt,
  revokedAt: workspaceInvitations.revokedAt,
  createdAt: workspaceInvitations.createdAt,
}

export async function createInvitationRecord(input: NewInvitationRecord) {
  const [created] = await db.insert(workspaceInvitations).values(input).returning({ id: workspaceInvitations.id })
  return created ? findInvitationById(created.id) : null
}

export async function findInvitationById(invitationId: string) {
  const [invitation] = await db
    .select(invitationSelection)
    .from(workspaceInvitations)
    .innerJoin(workspaces, eq(workspaces.id, workspaceInvitations.workspaceId))
    .leftJoin(projects, eq(projects.id, workspaceInvitations.projectId))
    .where(eq(workspaceInvitations.id, invitationId))
    .limit(1)
  return invitation ?? null
}

export async function findInvitationByTokenHash(tokenHash: string) {
  const [invitation] = await db
    .select(invitationSelection)
    .from(workspaceInvitations)
    .innerJoin(workspaces, eq(workspaces.id, workspaceInvitations.workspaceId))
    .leftJoin(projects, eq(projects.id, workspaceInvitations.projectId))
    .where(eq(workspaceInvitations.tokenHash, tokenHash))
    .limit(1)
  return invitation ?? null
}

export function listWorkspaceInvitationRecords(workspaceId: string) {
  return db
    .select(invitationSelection)
    .from(workspaceInvitations)
    .innerJoin(workspaces, eq(workspaces.id, workspaceInvitations.workspaceId))
    .leftJoin(projects, eq(projects.id, workspaceInvitations.projectId))
    .where(eq(workspaceInvitations.workspaceId, workspaceId))
    .orderBy(desc(workspaceInvitations.createdAt))
}

export async function rotateInvitationToken(invitationId: string, tokenHash: string, expiresAt: Date) {
  const [updated] = await db
    .update(workspaceInvitations)
    .set({
      tokenHash,
      expiresAt,
      deliveryStatus: "pending",
      deliveryAttempt: sql`${workspaceInvitations.deliveryAttempt} + 1`,
      resendMessageId: null,
      deliveryErrorCode: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workspaceInvitations.id, invitationId),
        isNull(workspaceInvitations.acceptedAt),
        isNull(workspaceInvitations.revokedAt),
      ),
    )
    .returning({ id: workspaceInvitations.id })
  return updated ? findInvitationById(updated.id) : null
}

export async function recordInvitationDelivery(invitationId: string, messageId: string) {
  await db
    .update(workspaceInvitations)
    .set({
      deliveryStatus: "sent",
      resendMessageId: messageId,
      deliveryErrorCode: null,
      lastSentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(workspaceInvitations.id, invitationId))
}

export async function recordInvitationDeliveryFailure(invitationId: string, code: string) {
  await db
    .update(workspaceInvitations)
    .set({ deliveryStatus: "failed", deliveryErrorCode: code, updatedAt: new Date() })
    .where(eq(workspaceInvitations.id, invitationId))
}

export async function revokeInvitationRecord(invitationId: string, userId: string) {
  const [updated] = await db
    .update(workspaceInvitations)
    .set({ revokedAt: new Date(), revokedByUserId: userId, updatedAt: new Date() })
    .where(
      and(
        eq(workspaceInvitations.id, invitationId),
        isNull(workspaceInvitations.acceptedAt),
        isNull(workspaceInvitations.revokedAt),
      ),
    )
    .returning({ id: workspaceInvitations.id })
  return updated ? findInvitationById(updated.id) : null
}

export async function findActiveWorkspaceMemberByNormalizedEmail(workspaceId: string, normalizedEmail: string) {
  const [member] = await db
    .select({ id: workspaceMembers.id, userId: workspaceMembers.userId, workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(users.normalizedEmail, normalizedEmail),
        isNull(workspaceMembers.removedAt),
      ),
    )
    .limit(1)
  return member ?? null
}

export async function hasActiveProjectMembership(projectId: string, workspaceMemberId: string) {
  const [member] = await db
    .select({ id: projectMembers.id })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.workspaceMemberId, workspaceMemberId),
        isNull(projectMembers.removedAt),
      ),
    )
    .limit(1)
  return Boolean(member)
}

export async function acceptInvitationRecord(
  tokenHash: string,
  userId: string,
  normalizedEmail: string,
  actorName = "Workspace member",
) {
  const result = await db.execute<{
    invitationId: string
    workspaceId: string
    projectId: string | null
  }>(sql`
    WITH candidate AS MATERIALIZED (
      SELECT invitation.*
      FROM "workspace_invitations" AS invitation
      WHERE invitation."token_hash" = ${tokenHash}
        AND invitation."normalized_email" = ${normalizedEmail}
        AND invitation."accepted_at" IS NULL
        AND invitation."revoked_at" IS NULL
        AND invitation."expires_at" > NOW()
        AND (
          invitation."kind" = 'workspace'
          OR EXISTS (
            SELECT 1 FROM "workspace_members" AS existing_workspace_member
            WHERE existing_workspace_member."workspace_id" = invitation."workspace_id"
              AND existing_workspace_member."user_id" = ${userId}
              AND existing_workspace_member."removed_at" IS NULL
          )
        )
      FOR UPDATE
    ),
    inserted_workspace_member AS (
      INSERT INTO "workspace_members" ("workspace_id", "user_id", "role")
      SELECT candidate."workspace_id", ${userId}, candidate."workspace_role"
      FROM candidate
      WHERE candidate."kind" = 'workspace'
      ON CONFLICT ("workspace_id", "user_id") WHERE "removed_at" IS NULL DO NOTHING
      RETURNING "id", "workspace_id"
    ),
    selected_workspace_member AS (
      SELECT "id", "workspace_id" FROM inserted_workspace_member
      UNION ALL
      SELECT existing."id", existing."workspace_id"
      FROM "workspace_members" AS existing
      INNER JOIN candidate ON candidate."workspace_id" = existing."workspace_id"
      WHERE existing."user_id" = ${userId} AND existing."removed_at" IS NULL
      LIMIT 1
    ),
    inserted_project_member AS (
      INSERT INTO "project_members" ("workspace_id", "project_id", "workspace_member_id", "role")
      SELECT candidate."workspace_id", candidate."project_id", selected."id", candidate."board_role"
      FROM candidate
      INNER JOIN selected_workspace_member AS selected ON selected."workspace_id" = candidate."workspace_id"
      WHERE candidate."project_id" IS NOT NULL
      ON CONFLICT ("project_id", "workspace_member_id") WHERE "removed_at" IS NULL DO NOTHING
      RETURNING "id"
    ),
    accepted AS (
      UPDATE "workspace_invitations" AS invitation
      SET "accepted_at" = NOW(), "accepted_by_user_id" = ${userId}, "updated_at" = NOW()
      FROM candidate
      WHERE invitation."id" = candidate."id"
        AND EXISTS (SELECT 1 FROM selected_workspace_member)
      RETURNING invitation."id", invitation."workspace_id", invitation."project_id"
    ),
    activity_insert AS (
      INSERT INTO "activity_logs" (
        "workspace_id", "project_id", "actor_workspace_member_id", "action", "schema_version", "metadata"
      )
      SELECT
        accepted."workspace_id",
        accepted."project_id",
        selected_workspace_member."id",
        'invitation.accepted',
        1,
        jsonb_build_object(
          'actorName', ${actorName}::text,
          'workspaceName', workspace."name",
          'invitedEmail', candidate."normalized_email",
          'invitationKind', candidate."kind",
          'projectTitle', project."title"
        )
      FROM accepted
      INNER JOIN candidate ON candidate."id" = accepted."id"
      INNER JOIN selected_workspace_member ON selected_workspace_member."workspace_id" = accepted."workspace_id"
      INNER JOIN "workspaces" AS workspace ON workspace."id" = accepted."workspace_id"
      LEFT JOIN "projects" AS project ON project."id" = accepted."project_id"
      RETURNING "id"
    )
    SELECT "id" AS "invitationId", "workspace_id" AS "workspaceId", "project_id" AS "projectId"
    FROM accepted
    WHERE EXISTS (SELECT 1 FROM activity_insert)
  `)
  return result.rows[0] ?? null
}
