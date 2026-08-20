import { randomUUID } from "node:crypto"

import { neon } from "@neondatabase/serverless"
import { inArray } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  findLatestPaidUserCheckoutPurchase,
  findLatestPaidWorkspaceCheckoutPurchase,
  findLatestUserCheckoutPurchase,
  findLatestWorkspaceCheckoutPurchase,
  listActiveOwnedWorkspaces,
} from "@/features/billing/repositories/subscription-page.repository"
import * as schema from "@/server/db/schema"
import { billingCheckoutPurchases, billingPlans, users, workspaceMembers, workspaces } from "@/server/db/schema"

const client = neon(process.env.TEST_DATABASE_URL as string)
const database = drizzle({ client, schema })

let userIds: string[] = []
let workspaceIds: string[] = []
let planIds: string[] = []

async function createWorkspace(input: { name: string; ownerUserId: string; status?: "active" | "suspended" }) {
  const workspaceId = randomUUID()
  const ownerMembershipId = randomUUID()
  await database.batch([
    database.insert(workspaces).values({
      id: workspaceId,
      name: input.name,
      status: input.status ?? "active",
      ownerWorkspaceMemberId: ownerMembershipId,
    }),
    database.insert(workspaceMembers).values({
      id: ownerMembershipId,
      workspaceId,
      userId: input.ownerUserId,
      role: "admin",
    }),
  ])
  workspaceIds.push(workspaceId)
  return workspaceId
}

beforeEach(async () => {
  userIds = []
  workspaceIds = []
  planIds = []
})

afterEach(async () => {
  if (userIds.length > 0)
    await database.delete(billingCheckoutPurchases).where(inArray(billingCheckoutPurchases.payerUserId, userIds))
  if (workspaceIds.length > 0) await database.delete(workspaces).where(inArray(workspaces.id, workspaceIds))
  if (userIds.length > 0) await database.delete(users).where(inArray(users.id, userIds))
  if (planIds.length > 0) await database.delete(billingPlans).where(inArray(billingPlans.id, planIds))
})

describe("subscription page persistence", () => {
  it("returns active owned workspaces and each subject's newest purchase", async () => {
    const suffix = randomUUID()
    const [owner, otherOwner] = await database
      .insert(users)
      .values([
        {
          clerkId: `subscription_owner_${suffix}`,
          email: `subscription-owner-${suffix}@projectflow.test`,
          normalizedEmail: `subscription-owner-${suffix}@projectflow.test`,
          name: "Subscription Owner",
        },
        {
          clerkId: `subscription_other_${suffix}`,
          email: `subscription-other-${suffix}@projectflow.test`,
          normalizedEmail: `subscription-other-${suffix}@projectflow.test`,
          name: "Other Owner",
        },
      ])
      .returning()
    userIds.push(owner.id, otherOwner.id)

    const ownedWorkspaceId = await createWorkspace({ name: "Owned Active", ownerUserId: owner.id })
    await createWorkspace({ name: "Owned Suspended", ownerUserId: owner.id, status: "suspended" })
    const administeredWorkspaceId = await createWorkspace({ name: "Admin Only", ownerUserId: otherOwner.id })
    await database.insert(workspaceMembers).values({
      workspaceId: administeredWorkspaceId,
      userId: owner.id,
      role: "admin",
    })

    const [userPlan, workspacePlan] = await database
      .insert(billingPlans)
      .values([
        {
          code: `subscription-page-user-${suffix}`,
          name: "User Pro",
          target: "user",
          amount: 29_900,
          active: false,
        },
        {
          code: `subscription-page-workspace-${suffix}`,
          name: "Workspace Pro",
          target: "workspace",
          amount: 39_900,
          active: false,
        },
      ])
      .returning()
    planIds.push(userPlan.id, workspacePlan.id)

    await database.insert(billingCheckoutPurchases).values([
      {
        planId: userPlan.id,
        target: "user",
        userId: owner.id,
        payerUserId: owner.id,
        referenceNumber: `subscription-user-old-${suffix}`,
        amount: 29_900,
        createdAt: new Date("2026-08-01T00:00:00.000Z"),
      },
      {
        planId: userPlan.id,
        target: "user",
        userId: owner.id,
        payerUserId: owner.id,
        referenceNumber: `subscription-user-new-${suffix}`,
        amount: 29_900,
        createdAt: new Date("2026-08-02T00:00:00.000Z"),
      },
      {
        planId: workspacePlan.id,
        target: "workspace",
        workspaceId: ownedWorkspaceId,
        payerUserId: owner.id,
        referenceNumber: `subscription-workspace-${suffix}`,
        amount: 39_900,
      },
    ])

    await expect(listActiveOwnedWorkspaces(owner.id)).resolves.toEqual([{ id: ownedWorkspaceId, name: "Owned Active" }])
    await expect(findLatestUserCheckoutPurchase(owner.id)).resolves.toMatchObject({
      purchase: { referenceNumber: `subscription-user-new-${suffix}` },
      plan: { id: userPlan.id },
    })
    await expect(findLatestWorkspaceCheckoutPurchase(ownedWorkspaceId)).resolves.toMatchObject({
      purchase: { referenceNumber: `subscription-workspace-${suffix}` },
      plan: { id: workspacePlan.id },
    })
    await expect(findLatestPaidUserCheckoutPurchase(owner.id)).resolves.toBeNull()
    await expect(findLatestPaidWorkspaceCheckoutPurchase(ownedWorkspaceId)).resolves.toBeNull()
  })
})
