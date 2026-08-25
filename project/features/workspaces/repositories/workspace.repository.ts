import "server-only"

import { randomUUID } from "node:crypto"
import { and, count, desc, eq, isNull } from "drizzle-orm"

import type {
  CreateWorkspaceInput,
  UpdateWorkspaceDetailsInput,
  UpdateWorkspaceSettingsInput,
} from "@/features/workspaces/workspace.schema"
import { db } from "@/server/db/client"
import { userPresence, users, workspaceMembers, workspaceSettings, workspaces } from "@/server/db/schema"

export async function createWorkspaceWithOwner(userId: string, input: CreateWorkspaceInput) {
  const workspaceId = randomUUID()
  const ownerMembershipId = randomUUID()

  const results = await db.batch([
    db
      .insert(workspaces)
      .values({
        id: workspaceId,
        name: input.name,
        description: input.description ?? null,
        ownerWorkspaceMemberId: ownerMembershipId,
      })
      .returning(),
    db.insert(workspaceMembers).values({ id: ownerMembershipId, workspaceId, userId, role: "admin" }).returning(),
    db.insert(workspaceSettings).values({ workspaceId }).returning(),
  ])

  return results[0][0] ?? null
}

export async function listActiveWorkspaceMemberships(userId: string) {
  return db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      description: workspaces.description,
      status: workspaces.status,
      ownerWorkspaceMemberId: workspaces.ownerWorkspaceMemberId,
      membershipId: workspaceMembers.id,
      membershipRole: workspaceMembers.role,
      membershipRemovedAt: workspaceMembers.removedAt,
      membersCanCreateProjects: workspaceSettings.membersCanCreateProjects,
      createdAt: workspaces.createdAt,
      updatedAt: workspaces.updatedAt,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .innerJoin(workspaceSettings, eq(workspaceSettings.workspaceId, workspaces.id))
    .where(and(eq(workspaceMembers.userId, userId), isNull(workspaceMembers.removedAt), isNull(workspaces.deletedAt)))
    .orderBy(desc(workspaces.updatedAt))
}

export async function countActiveWorkspaceMembers(workspaceId: string) {
  const [result] = await db
    .select({ value: count() })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), isNull(workspaceMembers.removedAt)))
  return result?.value ?? 0
}

export async function findActiveWorkspaceAccess(workspaceId: string, userId: string) {
  const [result] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      description: workspaces.description,
      status: workspaces.status,
      ownerWorkspaceMemberId: workspaces.ownerWorkspaceMemberId,
      membershipId: workspaceMembers.id,
      membershipRole: workspaceMembers.role,
      membershipRemovedAt: workspaceMembers.removedAt,
      membersCanCreateProjects: workspaceSettings.membersCanCreateProjects,
      createdAt: workspaces.createdAt,
      updatedAt: workspaces.updatedAt,
    })
    .from(workspaces)
    .innerJoin(
      workspaceMembers,
      and(eq(workspaceMembers.workspaceId, workspaces.id), eq(workspaceMembers.userId, userId)),
    )
    .innerJoin(workspaceSettings, eq(workspaceSettings.workspaceId, workspaces.id))
    .where(and(eq(workspaces.id, workspaceId), isNull(workspaces.deletedAt), isNull(workspaceMembers.removedAt)))
    .limit(1)
  return result ?? null
}

export async function listActiveWorkspaceMembers(workspaceId: string) {
  return db
    .select({
      id: workspaceMembers.id,
      userId: workspaceMembers.userId,
      name: users.name,
      email: users.email,
      role: workspaceMembers.role,
      removedAt: workspaceMembers.removedAt,
      joinedAt: workspaceMembers.joinedAt,
      lastSeenAt: userPresence.lastSeenAt,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .leftJoin(userPresence, eq(userPresence.userId, users.id))
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), isNull(workspaceMembers.removedAt)))
    .orderBy(workspaceMembers.joinedAt)
}

export async function findActiveWorkspaceMember(workspaceId: string, memberId: string) {
  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.id, memberId),
        isNull(workspaceMembers.removedAt),
      ),
    )
    .limit(1)
  return member ?? null
}

export async function updateWorkspaceDetailsById(workspaceId: string, input: UpdateWorkspaceDetailsInput) {
  const values = {
    ...input,
    ...(Object.hasOwn(input, "description") ? { description: input.description ?? null } : {}),
    updatedAt: new Date(),
  }
  const [workspace] = await db
    .update(workspaces)
    .set(values)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.status, "active")))
    .returning()
  return workspace ?? null
}

export async function updateWorkspaceSettingsById(workspaceId: string, input: UpdateWorkspaceSettingsInput) {
  const [settings] = await db
    .update(workspaceSettings)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(workspaceSettings.workspaceId, workspaceId))
    .returning()
  return settings ?? null
}

export async function updateWorkspaceMemberRoleById(memberId: string, role: "admin" | "member") {
  const [member] = await db
    .update(workspaceMembers)
    .set({ role, updatedAt: new Date() })
    .where(and(eq(workspaceMembers.id, memberId), isNull(workspaceMembers.removedAt)))
    .returning()
  return member ?? null
}

export async function softRemoveWorkspaceMemberById(memberId: string) {
  const now = new Date()
  const [member] = await db
    .update(workspaceMembers)
    .set({ removedAt: now, updatedAt: now })
    .where(and(eq(workspaceMembers.id, memberId), isNull(workspaceMembers.removedAt)))
    .returning()
  return member ?? null
}

export async function transferWorkspaceOwnership(
  workspaceId: string,
  currentOwnerMembershipId: string,
  newOwnerMembershipId: string,
) {
  const now = new Date()
  const results = await db.batch([
    db
      .update(workspaceMembers)
      .set({ role: "admin", updatedAt: now })
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.id, currentOwnerMembershipId),
          isNull(workspaceMembers.removedAt),
        ),
      )
      .returning({ id: workspaceMembers.id }),
    db
      .update(workspaceMembers)
      .set({ role: "admin", updatedAt: now })
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.id, newOwnerMembershipId),
          isNull(workspaceMembers.removedAt),
        ),
      )
      .returning({ id: workspaceMembers.id }),
    db
      .update(workspaces)
      .set({ ownerWorkspaceMemberId: newOwnerMembershipId, updatedAt: now })
      .where(
        and(
          eq(workspaces.id, workspaceId),
          eq(workspaces.ownerWorkspaceMemberId, currentOwnerMembershipId),
          eq(workspaces.status, "active"),
        ),
      )
      .returning(),
  ])

  return results[0].length === 1 && results[1].length === 1 ? (results[2][0] ?? null) : null
}
