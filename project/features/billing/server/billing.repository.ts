import "server-only"

import { createHash } from "node:crypto"
import { and, count, desc, eq, gt, isNull, lte, or, sql } from "drizzle-orm"

import type { BillingStatus, BillingTarget } from "@/features/billing/billing.types"
import { db } from "@/server/db/client"
import {
  billingCustomers,
  billingPlans,
  billingSubscriptions,
  billingWebhookEvents,
  projects,
  users,
  workspaceMembers,
  workspaces,
} from "@/server/db/schema"

export async function listActiveBillingPlans(target?: BillingTarget) {
  return db
    .select()
    .from(billingPlans)
    .where(and(eq(billingPlans.active, true), target ? eq(billingPlans.target, target) : undefined))
    .orderBy(billingPlans.target, billingPlans.amount)
}

export async function findBillingPlan(id: string) {
  const [plan] = await db.select().from(billingPlans).where(eq(billingPlans.id, id)).limit(1)
  return plan ?? null
}

export async function findFreeBillingPlan(target: BillingTarget) {
  const [plan] = await db
    .select()
    .from(billingPlans)
    .where(and(eq(billingPlans.target, target), eq(billingPlans.amount, 0), eq(billingPlans.active, true)))
    .orderBy(desc(billingPlans.version))
    .limit(1)
  return plan ?? null
}

export async function findPaidBillingPlan(target: BillingTarget) {
  const [plan] = await db
    .select()
    .from(billingPlans)
    .where(and(eq(billingPlans.target, target), gt(billingPlans.amount, 0), eq(billingPlans.active, true)))
    .orderBy(desc(billingPlans.version))
    .limit(1)
  return plan ?? null
}

export async function findUserSubscriptionTier(userId: string) {
  const now = new Date()
  await db
    .update(users)
    .set({ subscriptionTier: "free", updatedAt: now })
    .where(and(eq(users.id, userId), eq(users.subscriptionTier, "pro"), lte(users.subscriptionEndsAt, now)))
  const [user] = await db
    .select({
      tier: users.subscriptionTier,
      startsAt: users.subscriptionStartedAt,
      endsAt: users.subscriptionEndsAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return user ?? null
}

export async function findWorkspaceSubscriptionTier(workspaceId: string) {
  const now = new Date()
  await db
    .update(workspaces)
    .set({ subscriptionTier: "free", updatedAt: now })
    .where(
      and(
        eq(workspaces.id, workspaceId),
        eq(workspaces.subscriptionTier, "pro"),
        lte(workspaces.subscriptionEndsAt, now),
      ),
    )
  const [workspace] = await db
    .select({
      tier: workspaces.subscriptionTier,
      startsAt: workspaces.subscriptionStartedAt,
      endsAt: workspaces.subscriptionEndsAt,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1)
  return workspace ?? null
}

export async function setSubscriptionTier(input: {
  target: BillingTarget
  userId: string | null
  workspaceId: string | null
  tier: "free" | "pro"
  extend?: boolean
}) {
  const now = new Date()
  if (input.target === "user" && input.userId) {
    await db
      .update(users)
      .set(
        input.tier === "free"
          ? { subscriptionTier: "free", subscriptionStartedAt: null, subscriptionEndsAt: null, updatedAt: now }
          : input.extend
            ? {
                subscriptionTier: "pro",
                subscriptionStartedAt: now,
                subscriptionEndsAt: sql`GREATEST(COALESCE(${users.subscriptionEndsAt}, NOW()), NOW()) + INTERVAL '30 days'`,
                updatedAt: now,
              }
            : { subscriptionTier: "pro", updatedAt: now },
      )
      .where(eq(users.id, input.userId))
  } else if (input.target === "workspace" && input.workspaceId) {
    await db
      .update(workspaces)
      .set(
        input.tier === "free"
          ? { subscriptionTier: "free", subscriptionStartedAt: null, subscriptionEndsAt: null, updatedAt: now }
          : input.extend
            ? {
                subscriptionTier: "pro",
                subscriptionStartedAt: now,
                subscriptionEndsAt: sql`GREATEST(COALESCE(${workspaces.subscriptionEndsAt}, NOW()), NOW()) + INTERVAL '30 days'`,
                updatedAt: now,
              }
            : { subscriptionTier: "pro", updatedAt: now },
      )
      .where(eq(workspaces.id, input.workspaceId))
  }
}

export async function findCurrentUserSubscription(userId: string) {
  const [row] = await db
    .select({ subscription: billingSubscriptions, plan: billingPlans })
    .from(billingSubscriptions)
    .innerJoin(billingPlans, eq(billingPlans.id, billingSubscriptions.planId))
    .where(and(eq(billingSubscriptions.userId, userId), eq(billingSubscriptions.target, "user")))
    .orderBy(desc(billingSubscriptions.providerUpdatedAt))
    .limit(1)
  return row ?? null
}

export async function findCurrentWorkspaceSubscription(workspaceId: string) {
  const [row] = await db
    .select({ subscription: billingSubscriptions, plan: billingPlans })
    .from(billingSubscriptions)
    .innerJoin(billingPlans, eq(billingPlans.id, billingSubscriptions.planId))
    .where(and(eq(billingSubscriptions.workspaceId, workspaceId), eq(billingSubscriptions.target, "workspace")))
    .orderBy(desc(billingSubscriptions.providerUpdatedAt))
    .limit(1)
  return row ?? null
}

export async function countWorkspaceCapacity(workspaceId: string) {
  const [[projectCount], [memberCount]] = await Promise.all([
    db.select({ value: count() }).from(projects).where(eq(projects.workspaceId, workspaceId)),
    db
      .select({ value: count() })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), isNull(workspaceMembers.removedAt))),
  ])
  return { projectCount: projectCount?.value ?? 0, memberCount: memberCount?.value ?? 0 }
}

export async function findBillingCustomer(userId: string, livemode: boolean) {
  const [customer] = await db
    .select()
    .from(billingCustomers)
    .where(and(eq(billingCustomers.userId, userId), eq(billingCustomers.livemode, livemode)))
    .limit(1)
  return customer ?? null
}

export async function insertBillingCustomer(userId: string, paymongoCustomerId: string, livemode: boolean) {
  const [customer] = await db
    .insert(billingCustomers)
    .values({ userId, paymongoCustomerId, livemode })
    .onConflictDoUpdate({
      target: [billingCustomers.userId, billingCustomers.livemode],
      set: { paymongoCustomerId, updatedAt: new Date() },
    })
    .returning()
  return customer
}

export async function insertBillingSubscription(input: {
  planId: string
  target: BillingTarget
  userId: string | null
  workspaceId: string | null
  payerUserId: string
  billingCustomerId: string
  paymongoSubscriptionId: string
  startsAt: Date
  endsAt: Date
}) {
  const [subscription] = await db
    .insert(billingSubscriptions)
    .values({
      planId: input.planId,
      target: input.target,
      userId: input.userId,
      workspaceId: input.workspaceId,
      payerUserId: input.payerUserId,
      billingCustomerId: input.billingCustomerId,
      paymongoSubscriptionId: input.paymongoSubscriptionId,
      currentPeriodStartsAt: input.startsAt,
      currentPeriodEndsAt: input.endsAt,
      providerUpdatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: billingSubscriptions.paymongoSubscriptionId,
      set: { providerUpdatedAt: new Date(), updatedAt: new Date() },
    })
    .returning()
  return subscription
}

export async function findSubscriptionById(id: string) {
  const [row] = await db
    .select({ subscription: billingSubscriptions, plan: billingPlans })
    .from(billingSubscriptions)
    .innerJoin(billingPlans, eq(billingPlans.id, billingSubscriptions.planId))
    .where(eq(billingSubscriptions.id, id))
    .limit(1)
  return row ?? null
}

export async function updateSubscriptionFromProvider(input: {
  paymongoSubscriptionId: string
  status: BillingStatus
  providerUpdatedAt: Date
  nextBillingAt?: Date | null
  periodEndsAt?: Date | null
  cancelledAt?: Date | null
  cancellationReason?: string | null
}) {
  const [subscription] = await db
    .update(billingSubscriptions)
    .set({
      status: input.status,
      providerUpdatedAt: input.providerUpdatedAt,
      nextBillingAt: input.nextBillingAt,
      currentPeriodStartsAt: input.periodEndsAt
        ? sql`CASE WHEN ${billingSubscriptions.currentPeriodEndsAt} < ${input.periodEndsAt} THEN ${billingSubscriptions.currentPeriodEndsAt} ELSE ${billingSubscriptions.currentPeriodStartsAt} END`
        : undefined,
      currentPeriodEndsAt: input.periodEndsAt ?? undefined,
      cancelledAt: input.cancelledAt,
      cancellationReason: input.cancellationReason,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(billingSubscriptions.paymongoSubscriptionId, input.paymongoSubscriptionId),
        sql`${billingSubscriptions.providerUpdatedAt} <= ${input.providerUpdatedAt}`,
      ),
    )
    .returning()
  return subscription ?? null
}

export async function beginWebhookEvent(input: {
  providerEventId: string
  eventType: string
  providerCreatedAt: Date
  rawBody: string
}) {
  const payloadHash = createHash("sha256").update(input.rawBody).digest("hex")
  const result = await db.execute<{ id: string }>(sql`
    INSERT INTO "billing_webhook_events" (
      "provider_event_id", "event_type", "provider_created_at", "payload_hash", "status"
    ) VALUES (${input.providerEventId}, ${input.eventType}, ${input.providerCreatedAt}, ${payloadHash}, 'processing')
    ON CONFLICT ("provider_event_id") DO UPDATE SET
      "status" = 'processing', "error_code" = NULL, "processed_at" = NULL, "updated_at" = NOW()
    WHERE "billing_webhook_events"."status" = 'failed'
      AND "billing_webhook_events"."payload_hash" = EXCLUDED."payload_hash"
    RETURNING "id"
  `)
  return result.rows[0] ?? null
}

export async function finishWebhookEvent(providerEventId: string, errorCode?: string) {
  await db
    .update(billingWebhookEvents)
    .set({
      status: errorCode ? "failed" : "processed",
      errorCode: errorCode ?? null,
      processedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(billingWebhookEvents.providerEventId, providerEventId))
}

export async function findWorkspaceOwnerUserId(workspaceId: string) {
  const [row] = await db
    .select({ userId: workspaceMembers.userId })
    .from(workspaces)
    .innerJoin(workspaceMembers, eq(workspaceMembers.id, workspaces.ownerWorkspaceMemberId))
    .where(and(eq(workspaces.id, workspaceId), or(eq(workspaces.status, "active"), eq(workspaces.status, "suspended"))))
    .limit(1)
  return row?.userId ?? null
}
