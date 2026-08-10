import { randomUUID } from "node:crypto"

import { neon } from "@neondatabase/serverless"
import { and, eq, inArray } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { afterEach, describe, expect, it } from "vitest"

import { softDeleteUserByClerkId, upsertUser } from "../../features/auth/server/user.repository"
import {
  createWorkspaceWithOwner,
  findActiveWorkspaceAccess,
  softRemoveWorkspaceMemberById,
  transferWorkspaceOwnership,
} from "../../features/workspaces/server/workspace.repository"
import * as schema from "../../server/db/schema"
import { users, workspaceMembers, workspaceSettings, workspaces } from "../../server/db/schema"

const client = neon(process.env.TEST_DATABASE_URL as string)
const database = drizzle({ client, schema })
const createdWorkspaceIds = new Set<string>()
const createdUserIds = new Set<string>()

async function createUser(label: string, overrides: Partial<typeof users.$inferInsert> = {}) {
  const suffix = `${label}-${randomUUID()}`
  const email = `${suffix}@projectflow.test`.toLowerCase()
  const [user] = await database
    .insert(users)
    .values({
      clerkId: `user_${suffix}`,
      email,
      normalizedEmail: email,
      name: `Test ${label}`,
      ...overrides,
    })
    .returning()
  createdUserIds.add(user.id)
  return user
}

async function trackWorkspace(workspaceId: string) {
  createdWorkspaceIds.add(workspaceId)
  return workspaceId
}

async function createRawWorkspace(ownerUserId: string, label: string) {
  const workspaceId = randomUUID()
  const ownerMembershipId = randomUUID()
  await database.batch([
    database.insert(workspaces).values({
      id: workspaceId,
      name: `Workspace ${label}`,
      ownerWorkspaceMemberId: ownerMembershipId,
    }),
    database
      .insert(workspaceMembers)
      .values({ id: ownerMembershipId, workspaceId, userId: ownerUserId, role: "admin" }),
    database.insert(workspaceSettings).values({ workspaceId }),
  ])
  await trackWorkspace(workspaceId)
  return { workspaceId, ownerMembershipId }
}

afterEach(async () => {
  if (createdWorkspaceIds.size > 0) {
    await database.delete(workspaces).where(inArray(workspaces.id, [...createdWorkspaceIds]))
    createdWorkspaceIds.clear()
  }
  if (createdUserIds.size > 0) {
    await database.delete(users).where(inArray(users.id, [...createdUserIds]))
    createdUserIds.clear()
  }
})

describe("workspace lifecycle repositories", () => {
  it("creates a workspace only when the user explicitly requests it", async () => {
    const suffix = randomUUID()
    const email = `clerk-${suffix}@projectflow.test`
    const user = await upsertUser({ clerkId: `user_${suffix}`, email, name: "Clerk-only user" })
    createdUserIds.add(user.id)

    const membershipsBeforeCreation = await database
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, user.id))
    expect(membershipsBeforeCreation).toHaveLength(0)

    const workspace = await createWorkspaceWithOwner(user.id, { name: "Explicit workspace" })
    if (!workspace) throw new Error("Expected explicit workspace creation to succeed")
    await trackWorkspace(workspace.id)

    const access = await findActiveWorkspaceAccess(workspace.id, user.id)
    expect(access?.membershipId).toBe(workspace.ownerWorkspaceMemberId)
  })

  it("soft-removes members so access is revoked without deleting history", async () => {
    const owner = await createUser("soft-remove-owner")
    const member = await createUser("soft-remove-member")
    const workspace = await createRawWorkspace(owner.id, "soft-remove")
    const [membership] = await database
      .insert(workspaceMembers)
      .values({ workspaceId: workspace.workspaceId, userId: member.id, role: "member" })
      .returning()

    expect(await findActiveWorkspaceAccess(workspace.workspaceId, member.id)).not.toBeNull()
    await softRemoveWorkspaceMemberById(membership.id)

    expect(await findActiveWorkspaceAccess(workspace.workspaceId, member.id)).toBeNull()
    const [historicalMembership] = await database
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.id, membership.id))
    expect(historicalMembership.removedAt).toBeInstanceOf(Date)
  })

  it("transfers the single owner pointer while retaining both active memberships", async () => {
    const owner = await createUser("transfer-owner")
    const nextOwner = await createUser("transfer-next")
    const workspace = await createRawWorkspace(owner.id, "transfer")
    const [nextMembership] = await database
      .insert(workspaceMembers)
      .values({ workspaceId: workspace.workspaceId, userId: nextOwner.id, role: "member" })
      .returning()

    const transferred = await transferWorkspaceOwnership(
      workspace.workspaceId,
      workspace.ownerMembershipId,
      nextMembership.id,
    )
    expect(transferred?.ownerWorkspaceMemberId).toBe(nextMembership.id)

    const memberships = await database
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspace.workspaceId))
    expect(memberships).toHaveLength(2)
    expect(memberships.every((membership) => membership.removedAt === null)).toBe(true)
  })
})

describe("Clerk account lifecycle persistence", () => {
  it("preserves system role and suspension when Clerk profile data changes", async () => {
    const user = await createUser("preserve-account", { accountStatus: "suspended", systemRole: "super_admin" })
    const updated = await upsertUser({
      clerkId: user.clerkId,
      email: `updated-${randomUUID()}@projectflow.test`,
      name: "Updated profile",
    })

    expect(updated.accountStatus).toBe("suspended")
    expect(updated.systemRole).toBe("super_admin")
    expect(updated.name).toBe("Updated profile")
  })

  it("soft-deletes an account, suspends owned workspaces, and removes other active memberships", async () => {
    const deletedUser = await createUser("deleted-owner")
    const otherOwner = await createUser("other-owner")
    const ownedWorkspace = await createRawWorkspace(deletedUser.id, "owned")
    const otherWorkspace = await createRawWorkspace(otherOwner.id, "other")
    const [externalMembership] = await database
      .insert(workspaceMembers)
      .values({ workspaceId: otherWorkspace.workspaceId, userId: deletedUser.id, role: "member" })
      .returning()

    await softDeleteUserByClerkId(deletedUser.clerkId)

    const [account] = await database.select().from(users).where(eq(users.id, deletedUser.id))
    const [owned] = await database.select().from(workspaces).where(eq(workspaces.id, ownedWorkspace.workspaceId))
    const memberships = await database
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.userId, deletedUser.id),
          inArray(workspaceMembers.id, [ownedWorkspace.ownerMembershipId, externalMembership.id]),
        ),
      )

    expect(account.accountStatus).toBe("deleted")
    expect(account.deletedAt).toBeInstanceOf(Date)
    expect(account.email).toContain(`deleted+${deletedUser.id}`)
    expect(owned.status).toBe("suspended")
    expect(memberships.find((member) => member.id === ownedWorkspace.ownerMembershipId)?.removedAt).toBeNull()
    expect(memberships.find((member) => member.id === externalMembership.id)?.removedAt).toBeInstanceOf(Date)
  })
})
