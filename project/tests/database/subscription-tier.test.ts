import { randomUUID } from "node:crypto"

import { neon } from "@neondatabase/serverless"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { afterEach, describe, expect, it } from "vitest"

import { findUserSubscriptionTier } from "@/features/billing/repositories/billing.repository"
import * as schema from "@/server/db/schema"
import { users, workspaceMembers, workspaces } from "@/server/db/schema"

const client = neon(process.env.TEST_DATABASE_URL as string)
const database = drizzle({ client, schema })
const createdUserIds = new Set<string>()
const createdWorkspaceIds = new Set<string>()

async function createUser() {
  const suffix = randomUUID()
  const email = `subscription-${suffix}@projectflow.test`
  const [user] = await database
    .insert(users)
    .values({ clerkId: `user_${suffix}`, email, normalizedEmail: email, name: "Subscription Test" })
    .returning()
  createdUserIds.add(user.id)
  return user
}

async function createWorkspace(userId: string) {
  const workspaceId = randomUUID()
  const membershipId = randomUUID()
  await database.batch([
    database
      .insert(workspaces)
      .values({ id: workspaceId, name: "Subscription Test", ownerWorkspaceMemberId: membershipId }),
    database.insert(workspaceMembers).values({ id: membershipId, workspaceId, userId, role: "admin" }),
  ])
  createdWorkspaceIds.add(workspaceId)
  return workspaceId
}

afterEach(async () => {
  for (const workspaceId of createdWorkspaceIds) {
    await database.delete(workspaces).where(eq(workspaces.id, workspaceId))
  }
  for (const userId of createdUserIds) {
    await database.delete(users).where(eq(users.id, userId))
  }
  createdWorkspaceIds.clear()
  createdUserIds.clear()
})

describe("simple subscription tiers", () => {
  it("starts a 30-day user period when Studio-style updates set the tier to Pro", async () => {
    const user = await createUser()
    const before = Date.now()
    const [subscribed] = await database
      .update(users)
      .set({ subscriptionTier: "pro" })
      .where(eq(users.id, user.id))
      .returning()

    expect(subscribed.subscriptionStartedAt?.getTime()).toBeGreaterThanOrEqual(before)
    expect(subscribed.subscriptionEndsAt?.getTime()).toBeGreaterThan(before + 29 * 24 * 60 * 60 * 1000)
    expect(subscribed.subscriptionEndsAt?.getTime()).toBeLessThan(before + 31 * 24 * 60 * 60 * 1000)
  })

  it("starts the same 30-day period for workspace Pro", async () => {
    const user = await createUser()
    const workspaceId = await createWorkspace(user.id)
    const [subscribed] = await database
      .update(workspaces)
      .set({ subscriptionTier: "pro" })
      .where(eq(workspaces.id, workspaceId))
      .returning()

    expect(subscribed.subscriptionStartedAt).toBeInstanceOf(Date)
    expect(subscribed.subscriptionEndsAt?.getTime()).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60 * 1000)
  })

  it("lazily downgrades an expired Pro user to Free", async () => {
    const user = await createUser()
    await database.update(users).set({ subscriptionTier: "pro" }).where(eq(users.id, user.id))
    await database
      .update(users)
      .set({ subscriptionEndsAt: new Date(Date.now() - 60_000) })
      .where(eq(users.id, user.id))

    const tier = await findUserSubscriptionTier(user.id)
    expect(tier).toEqual({ tier: "free", startsAt: null, endsAt: null })
  })
})
