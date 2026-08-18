import { randomUUID } from "node:crypto"

import { neon } from "@neondatabase/serverless"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { reserveCheckoutPurchase } from "@/features/billing/server/checkout.repository"
import * as schema from "@/server/db/schema"
import { billingCheckoutPurchases, billingPlans, users, workspaceMembers, workspaces } from "@/server/db/schema"

const client = neon(process.env.TEST_DATABASE_URL as string)
const database = drizzle({ client, schema })

let userId: string
let workspaceId: string
let planId: string

beforeEach(async () => {
  const suffix = randomUUID()
  const email = `checkout-${suffix}@projectflow.test`
  const [user] = await database
    .insert(users)
    .values({ clerkId: `checkout_${suffix}`, email, normalizedEmail: email, name: "Checkout Test" })
    .returning()
  userId = user.id

  workspaceId = randomUUID()
  const membershipId = randomUUID()
  await database.batch([
    database.insert(workspaces).values({
      id: workspaceId,
      name: "Checkout Test",
      ownerWorkspaceMemberId: membershipId,
    }),
    database.insert(workspaceMembers).values({
      id: membershipId,
      workspaceId,
      userId,
      role: "admin",
    }),
  ])

  const [plan] = await database
    .insert(billingPlans)
    .values({
      code: `checkout-test-${suffix}`,
      name: "Checkout Test Product",
      target: "user",
      amount: 29_900,
      currency: "PHP",
      interval: "monthly",
      version: 1,
      active: false,
    })
    .returning()
  planId = plan.id
})

afterEach(async () => {
  if (userId) await database.delete(billingCheckoutPurchases).where(eq(billingCheckoutPurchases.payerUserId, userId))
  if (workspaceId) await database.delete(workspaces).where(eq(workspaces.id, workspaceId))
  if (userId) await database.delete(users).where(eq(users.id, userId))
  if (planId) await database.delete(billingPlans).where(eq(billingPlans.id, planId))
})

describe("billing checkout purchase persistence", () => {
  it("stores user and workspace purchase subjects", async () => {
    const [userPurchase] = await database
      .insert(billingCheckoutPurchases)
      .values({
        planId,
        target: "user",
        userId,
        payerUserId: userId,
        referenceNumber: `user-${randomUUID()}`,
        amount: 29_900,
      })
      .returning()

    const [workspacePurchase] = await database
      .insert(billingCheckoutPurchases)
      .values({
        planId,
        target: "workspace",
        workspaceId,
        payerUserId: userId,
        referenceNumber: `workspace-${randomUUID()}`,
        amount: 39_900,
      })
      .returning()

    expect(userPurchase).toMatchObject({ target: "user", userId, workspaceId: null, status: "pending" })
    expect(workspacePurchase).toMatchObject({ target: "workspace", userId: null, workspaceId, status: "pending" })
  })

  it("rejects a purchase whose subject does not match its target", async () => {
    await expect(
      database.insert(billingCheckoutPurchases).values({
        planId,
        target: "user",
        workspaceId,
        payerUserId: userId,
        referenceNumber: `invalid-subject-${randomUUID()}`,
        amount: 29_900,
      }),
    ).rejects.toThrow()
  })

  it("rejects zero-value checkout purchases", async () => {
    await expect(
      database.insert(billingCheckoutPurchases).values({
        planId,
        target: "user",
        userId,
        payerUserId: userId,
        referenceNumber: `invalid-amount-${randomUUID()}`,
        amount: 0,
      }),
    ).rejects.toThrow()
  })

  it("requires a paid timestamp when status is paid", async () => {
    await expect(
      database.insert(billingCheckoutPurchases).values({
        planId,
        target: "user",
        userId,
        payerUserId: userId,
        referenceNumber: `invalid-paid-${randomUUID()}`,
        amount: 29_900,
        status: "paid",
      }),
    ).rejects.toThrow()
  })

  it("enforces unique internal references and PayMongo Checkout Session IDs", async () => {
    const referenceNumber = `unique-${randomUUID()}`
    const paymongoCheckoutSessionId = `cs_${randomUUID()}`
    await database.insert(billingCheckoutPurchases).values({
      planId,
      target: "user",
      userId,
      payerUserId: userId,
      referenceNumber,
      paymongoCheckoutSessionId,
      amount: 29_900,
    })

    await expect(
      database.insert(billingCheckoutPurchases).values({
        planId,
        target: "user",
        userId,
        payerUserId: userId,
        referenceNumber,
        paymongoCheckoutSessionId: `cs_${randomUUID()}`,
        amount: 29_900,
      }),
    ).rejects.toThrow()

    await expect(
      database.insert(billingCheckoutPurchases).values({
        planId,
        target: "user",
        userId,
        payerUserId: userId,
        referenceNumber: `other-${randomUUID()}`,
        paymongoCheckoutSessionId,
        amount: 29_900,
      }),
    ).rejects.toThrow()
  })

  it("returns one logical reservation under concurrent retries", async () => {
    const referenceNumber = `concurrent-${randomUUID()}`
    const reservation = {
      planId,
      target: "user" as const,
      userId,
      workspaceId: null,
      payerUserId: userId,
      referenceNumber,
      amount: 29_900,
      currency: "PHP",
    }

    const purchases = await Promise.all(Array.from({ length: 6 }, () => reserveCheckoutPurchase(reservation)))

    expect(new Set(purchases.map((purchase) => purchase?.id)).size).toBe(1)
    expect(purchases.every((purchase) => purchase?.referenceNumber === referenceNumber)).toBe(true)
  })
})
