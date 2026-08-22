import { randomUUID } from "node:crypto"

import { neon } from "@neondatabase/serverless"
import { eq, inArray } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  cancelPendingCheckoutPurchase,
  reserveCheckoutPurchase,
} from "@/features/billing/repositories/checkout.repository"
import { fulfillCheckoutPurchase } from "@/features/billing/repositories/checkout-webhook.repository"
import * as schema from "@/server/db/schema"
import {
  billingCheckoutPurchases,
  billingPlans,
  billingWebhookEvents,
  users,
  workspaceMembers,
  workspaces,
} from "@/server/db/schema"

const client = neon(process.env.TEST_DATABASE_URL as string)
const database = drizzle({ client, schema })

let userId: string
let workspaceId: string
let planId: string
let webhookEventIds: string[]

beforeEach(async () => {
  webhookEventIds = []
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
  if (webhookEventIds.length > 0)
    await database.delete(billingWebhookEvents).where(inArray(billingWebhookEvents.providerEventId, webhookEventIds))
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

  it("cancels only a pending checkout owned by the authenticated payer", async () => {
    const [purchase] = await database
      .insert(billingCheckoutPurchases)
      .values({
        planId,
        target: "user",
        userId,
        payerUserId: userId,
        referenceNumber: `cancel-${randomUUID()}`,
        amount: 29_900,
      })
      .returning()

    await expect(cancelPendingCheckoutPurchase(purchase.id, randomUUID())).resolves.toBeNull()
    await expect(cancelPendingCheckoutPurchase(purchase.id, userId)).resolves.toMatchObject({
      id: purchase.id,
      status: "cancelled",
    })
  })

  it("still fulfills a cancelled checkout when a verified payment arrives later", async () => {
    const referenceNumber = `cancelled-paid-${randomUUID()}`
    const sessionId = `cs_${randomUUID()}`
    const [purchase] = await database
      .insert(billingCheckoutPurchases)
      .values({
        planId,
        target: "user",
        userId,
        payerUserId: userId,
        referenceNumber,
        paymongoCheckoutSessionId: sessionId,
        amount: 29_900,
        status: "cancelled",
      })
      .returning()
    const providerEventId = `evt_${randomUUID()}`
    webhookEventIds.push(providerEventId)

    const result = await fulfillCheckoutPurchase({
      purchaseId: purchase.id,
      target: "user",
      userId,
      workspaceId: null,
      providerEventId,
      providerCreatedAt: new Date(),
      rawBody: JSON.stringify({ id: providerEventId }),
      checkoutSessionId: sessionId,
      referenceNumber,
      paidAt: new Date(),
    })

    const [updated] = await database
      .select()
      .from(billingCheckoutPurchases)
      .where(eq(billingCheckoutPurchases.id, purchase.id))
      .limit(1)
    expect(result).toMatchObject({ claimed: true, fulfilled: true })
    expect(updated?.status).toBe("paid")
  })

  it("fulfills a user purchase once and extends an active entitlement from its existing end", async () => {
    const existingEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1_000)
    await database
      .update(users)
      .set({ subscriptionTier: "pro", subscriptionStartedAt: new Date() })
      .where(eq(users.id, userId))
    await database.update(users).set({ subscriptionEndsAt: existingEnd }).where(eq(users.id, userId))

    const referenceNumber = `fulfill-user-${randomUUID()}`
    const sessionId = `cs_${randomUUID()}`
    const [purchase] = await database
      .insert(billingCheckoutPurchases)
      .values({
        planId,
        target: "user",
        userId,
        payerUserId: userId,
        referenceNumber,
        paymongoCheckoutSessionId: sessionId,
        amount: 29_900,
      })
      .returning()

    const providerEventId = `evt_${randomUUID()}`
    webhookEventIds.push(providerEventId)
    const input = {
      purchaseId: purchase.id,
      target: "user" as const,
      userId,
      workspaceId: null,
      providerEventId,
      providerCreatedAt: new Date(),
      rawBody: JSON.stringify({ id: providerEventId }),
      checkoutSessionId: sessionId,
      referenceNumber,
      paidAt: new Date(),
    }

    const first = await fulfillCheckoutPurchase(input)
    const duplicate = await fulfillCheckoutPurchase(input)
    const secondEventId = `evt_${randomUUID()}`
    webhookEventIds.push(secondEventId)
    const samePurchaseDifferentEvent = await fulfillCheckoutPurchase({
      ...input,
      providerEventId: secondEventId,
      rawBody: JSON.stringify({ id: secondEventId }),
    })

    const [account] = await database.select().from(users).where(eq(users.id, userId)).limit(1)
    const [paidPurchase] = await database
      .select()
      .from(billingCheckoutPurchases)
      .where(eq(billingCheckoutPurchases.id, purchase.id))
      .limit(1)

    expect(first).toMatchObject({ claimed: true, fulfilled: true, purchase_id: purchase.id })
    expect(duplicate).toMatchObject({ claimed: false, fulfilled: false })
    expect(samePurchaseDifferentEvent).toMatchObject({ claimed: true, fulfilled: false })
    expect(account?.subscriptionTier).toBe("pro")
    expect(account?.subscriptionEndsAt?.getTime()).toBe(existingEnd.getTime() + 30 * 24 * 60 * 60 * 1_000)
    expect(paidPurchase).toMatchObject({ status: "paid", accessEndsAt: account?.subscriptionEndsAt })
  })

  it("grants a workspace purchase only to its workspace", async () => {
    const referenceNumber = `fulfill-workspace-${randomUUID()}`
    const sessionId = `cs_${randomUUID()}`
    const [purchase] = await database
      .insert(billingCheckoutPurchases)
      .values({
        planId,
        target: "workspace",
        workspaceId,
        payerUserId: userId,
        referenceNumber,
        paymongoCheckoutSessionId: sessionId,
        amount: 39_900,
      })
      .returning()
    const providerEventId = `evt_${randomUUID()}`
    webhookEventIds.push(providerEventId)

    await fulfillCheckoutPurchase({
      purchaseId: purchase.id,
      target: "workspace",
      userId: null,
      workspaceId,
      providerEventId,
      providerCreatedAt: new Date(),
      rawBody: JSON.stringify({ id: providerEventId }),
      checkoutSessionId: sessionId,
      referenceNumber,
      paidAt: new Date(),
    })

    const [[account], [workspace]] = await Promise.all([
      database.select().from(users).where(eq(users.id, userId)).limit(1),
      database.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1),
    ])
    expect(account?.subscriptionTier).toBe("free")
    expect(account?.subscriptionEndsAt).toBeNull()
    expect(workspace?.subscriptionTier).toBe("pro")
    expect(workspace?.subscriptionEndsAt).not.toBeNull()
  })
})
