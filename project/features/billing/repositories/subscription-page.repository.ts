import "server-only"

import { and, desc, eq, isNull } from "drizzle-orm"

import { db } from "@/server/db/client"
import { billingCheckoutPurchases, billingPlans, workspaceMembers, workspaces } from "@/server/db/schema"

export async function listActiveOwnedWorkspaces(userId: string) {
  return db
    .select({ id: workspaces.id, name: workspaces.name })
    .from(workspaces)
    .innerJoin(
      workspaceMembers,
      and(eq(workspaceMembers.id, workspaces.ownerWorkspaceMemberId), eq(workspaceMembers.workspaceId, workspaces.id)),
    )
    .where(
      and(eq(workspaces.status, "active"), eq(workspaceMembers.userId, userId), isNull(workspaceMembers.removedAt)),
    )
    .orderBy(workspaces.name)
}

export async function findLatestUserCheckoutPurchase(userId: string) {
  const [row] = await db
    .select({ purchase: billingCheckoutPurchases, plan: billingPlans })
    .from(billingCheckoutPurchases)
    .innerJoin(billingPlans, eq(billingPlans.id, billingCheckoutPurchases.planId))
    .where(and(eq(billingCheckoutPurchases.target, "user"), eq(billingCheckoutPurchases.userId, userId)))
    .orderBy(desc(billingCheckoutPurchases.createdAt))
    .limit(1)
  return row ?? null
}

export async function findLatestPaidUserCheckoutPurchase(userId: string) {
  const [row] = await db
    .select({ purchase: billingCheckoutPurchases, plan: billingPlans })
    .from(billingCheckoutPurchases)
    .innerJoin(billingPlans, eq(billingPlans.id, billingCheckoutPurchases.planId))
    .where(
      and(
        eq(billingCheckoutPurchases.target, "user"),
        eq(billingCheckoutPurchases.userId, userId),
        eq(billingCheckoutPurchases.status, "paid"),
      ),
    )
    .orderBy(desc(billingCheckoutPurchases.paidAt), desc(billingCheckoutPurchases.createdAt))
    .limit(1)
  return row ?? null
}

export async function findLatestWorkspaceCheckoutPurchase(workspaceId: string) {
  const [row] = await db
    .select({ purchase: billingCheckoutPurchases, plan: billingPlans })
    .from(billingCheckoutPurchases)
    .innerJoin(billingPlans, eq(billingPlans.id, billingCheckoutPurchases.planId))
    .where(and(eq(billingCheckoutPurchases.target, "workspace"), eq(billingCheckoutPurchases.workspaceId, workspaceId)))
    .orderBy(desc(billingCheckoutPurchases.createdAt))
    .limit(1)
  return row ?? null
}

export async function findLatestPaidWorkspaceCheckoutPurchase(workspaceId: string) {
  const [row] = await db
    .select({ purchase: billingCheckoutPurchases, plan: billingPlans })
    .from(billingCheckoutPurchases)
    .innerJoin(billingPlans, eq(billingPlans.id, billingCheckoutPurchases.planId))
    .where(
      and(
        eq(billingCheckoutPurchases.target, "workspace"),
        eq(billingCheckoutPurchases.workspaceId, workspaceId),
        eq(billingCheckoutPurchases.status, "paid"),
      ),
    )
    .orderBy(desc(billingCheckoutPurchases.paidAt), desc(billingCheckoutPurchases.createdAt))
    .limit(1)
  return row ?? null
}
