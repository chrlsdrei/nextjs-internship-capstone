import "server-only"

import { and, count, desc, eq, gt, isNull, lte, or } from "drizzle-orm"

import type { BillingTarget } from "@/features/billing/billing.types"
import { db } from "@/server/db/client"
import { billingPlans, projects, users, workspaceMembers, workspaces } from "@/server/db/schema"

export async function listActiveBillingPlans(target?: BillingTarget, livemode?: boolean) {
  return db
    .select()
    .from(billingPlans)
    .where(
      and(
        eq(billingPlans.active, true),
        target ? eq(billingPlans.target, target) : undefined,
        livemode === undefined ? undefined : eq(billingPlans.livemode, livemode),
      ),
    )
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

export async function findWorkspaceOwnerUserId(workspaceId: string) {
  const [row] = await db
    .select({ userId: workspaceMembers.userId })
    .from(workspaces)
    .innerJoin(workspaceMembers, eq(workspaceMembers.id, workspaces.ownerWorkspaceMemberId))
    .where(and(eq(workspaces.id, workspaceId), or(eq(workspaces.status, "active"), eq(workspaces.status, "suspended"))))
    .limit(1)
  return row?.userId ?? null
}
