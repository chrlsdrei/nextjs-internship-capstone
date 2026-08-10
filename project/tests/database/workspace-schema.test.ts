import { randomUUID } from "node:crypto"

import { neon } from "@neondatabase/serverless"
import { eq, inArray } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { afterEach, beforeAll, describe, expect, it } from "vitest"

import * as schema from "../../server/db/schema"
import { users, workspaceMembers, workspaceSettings, workspaces } from "../../server/db/schema"

const testDatabaseUrl = process.env.TEST_DATABASE_URL as string
const client = neon(testDatabaseUrl)
const database = drizzle({ client, schema })

const createdWorkspaceIds = new Set<string>()
const createdUserIds = new Set<string>()

async function createUser(label: string) {
  const suffix = `${label}-${randomUUID()}`
  const email = `${suffix}@projectflow.test`.toLowerCase()
  const [user] = await database
    .insert(users)
    .values({
      clerkId: `user_${suffix}`,
      email,
      name: `Test ${label}`,
      normalizedEmail: email,
    })
    .returning()

  createdUserIds.add(user.id)
  return user
}

async function createWorkspace(ownerUserId: string, label: string) {
  const workspaceId = randomUUID()
  const ownerMembershipId = randomUUID()

  await database.batch([
    database.insert(workspaces).values({
      id: workspaceId,
      name: `Workspace ${label}`,
      ownerWorkspaceMemberId: ownerMembershipId,
    }),
    database.insert(workspaceMembers).values({
      id: ownerMembershipId,
      role: "admin",
      userId: ownerUserId,
      workspaceId,
    }),
    database.insert(workspaceSettings).values({ workspaceId }),
  ])

  createdWorkspaceIds.add(workspaceId)
  return { ownerMembershipId, workspaceId }
}

async function addMember(workspaceId: string, userId: string) {
  const [membership] = await database
    .insert(workspaceMembers)
    .values({ role: "member", userId, workspaceId })
    .returning()

  return membership
}

beforeAll(async () => {
  const [result] = await client`
    select
      to_regclass('public.workspaces') as workspaces,
      to_regclass('public.workspace_members') as workspace_members,
      to_regclass('public.workspace_settings') as workspace_settings
  `

  if (!result.workspaces || !result.workspace_members || !result.workspace_settings) {
    throw new Error("Workspace schema is missing from TEST_DATABASE_URL. Run pnpm db:test:migrate first.")
  }
})

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

describe("workspace ownership constraints", () => {
  it("creates a workspace and its owner membership atomically", async () => {
    const owner = await createUser("atomic-owner")
    const created = await createWorkspace(owner.id, "atomic")

    const [workspace] = await database.select().from(workspaces).where(eq(workspaces.id, created.workspaceId))
    const [ownerMembership] = await database
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.id, created.ownerMembershipId))

    expect(workspace.ownerWorkspaceMemberId).toBe(ownerMembership.id)
    expect(ownerMembership.workspaceId).toBe(workspace.id)
    expect(ownerMembership.removedAt).toBeNull()
  })

  it("retains exactly one owner pointer after concurrent transfers", async () => {
    const initialOwner = await createUser("concurrent-owner")
    const firstCandidate = await createUser("concurrent-first")
    const secondCandidate = await createUser("concurrent-second")
    const created = await createWorkspace(initialOwner.id, "concurrent")
    const firstMembership = await addMember(created.workspaceId, firstCandidate.id)
    const secondMembership = await addMember(created.workspaceId, secondCandidate.id)

    await Promise.all([
      database
        .update(workspaces)
        .set({ ownerWorkspaceMemberId: firstMembership.id })
        .where(eq(workspaces.id, created.workspaceId)),
      database
        .update(workspaces)
        .set({ ownerWorkspaceMemberId: secondMembership.id })
        .where(eq(workspaces.id, created.workspaceId)),
    ])

    const [workspace] = await database.select().from(workspaces).where(eq(workspaces.id, created.workspaceId))
    expect([firstMembership.id, secondMembership.id]).toContain(workspace.ownerWorkspaceMemberId)
  })

  it("rejects an owner membership from another workspace", async () => {
    const firstOwner = await createUser("cross-workspace-first")
    const secondOwner = await createUser("cross-workspace-second")
    const firstWorkspace = await createWorkspace(firstOwner.id, "cross-first")
    const secondWorkspace = await createWorkspace(secondOwner.id, "cross-second")

    await expect(
      database
        .update(workspaces)
        .set({ ownerWorkspaceMemberId: secondWorkspace.ownerMembershipId })
        .where(eq(workspaces.id, firstWorkspace.workspaceId)),
    ).rejects.toThrow()

    const [unchangedWorkspace] = await database
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, firstWorkspace.workspaceId))
    expect(unchangedWorkspace.ownerWorkspaceMemberId).toBe(firstWorkspace.ownerMembershipId)
  })

  it("blocks owner removal until ownership is transferred", async () => {
    const initialOwner = await createUser("removal-owner")
    const nextOwner = await createUser("removal-next")
    const created = await createWorkspace(initialOwner.id, "removal")
    const nextMembership = await addMember(created.workspaceId, nextOwner.id)

    await expect(
      database
        .update(workspaceMembers)
        .set({ removedAt: new Date() })
        .where(eq(workspaceMembers.id, created.ownerMembershipId)),
    ).rejects.toThrow()

    const removedAt = new Date()
    await database.batch([
      database
        .update(workspaces)
        .set({ ownerWorkspaceMemberId: nextMembership.id })
        .where(eq(workspaces.id, created.workspaceId)),
      database.update(workspaceMembers).set({ removedAt }).where(eq(workspaceMembers.id, created.ownerMembershipId)),
    ])

    const [formerOwnerMembership] = await database
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.id, created.ownerMembershipId))
    expect(formerOwnerMembership.removedAt?.toISOString()).toBe(removedAt.toISOString())
  })
})
