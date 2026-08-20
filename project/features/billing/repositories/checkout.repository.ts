import "server-only"

import { and, eq, inArray, isNull } from "drizzle-orm"

import type { BillingTarget } from "@/features/billing/billing.types"
import { db } from "@/server/db/client"
import { billingCheckoutPurchases, billingPlans, users, workspaceMembers, workspaces } from "@/server/db/schema"

export async function findCheckoutPlan(id: string) {
  const [plan] = await db.select().from(billingPlans).where(eq(billingPlans.id, id)).limit(1)
  return plan ?? null
}

export async function findActiveWorkspaceOwnerUserId(workspaceId: string) {
  const [owner] = await db
    .select({ userId: users.id })
    .from(workspaces)
    .innerJoin(workspaceMembers, eq(workspaceMembers.id, workspaces.ownerWorkspaceMemberId))
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.status, "active"), isNull(workspaceMembers.removedAt)))
    .limit(1)
  return owner?.userId ?? null
}

export async function reserveCheckoutPurchase(input: {
  planId: string
  target: BillingTarget
  userId: string | null
  workspaceId: string | null
  payerUserId: string
  referenceNumber: string
  amount: number
  currency: string
}) {
  const [created] = await db
    .insert(billingCheckoutPurchases)
    .values(input)
    .onConflictDoNothing({ target: billingCheckoutPurchases.referenceNumber })
    .returning()
  if (created) return created

  const [existing] = await db
    .select()
    .from(billingCheckoutPurchases)
    .where(eq(billingCheckoutPurchases.referenceNumber, input.referenceNumber))
    .limit(1)
  return existing ?? null
}

export async function attachCheckoutSession(input: {
  purchaseId: string
  paymongoCheckoutSessionId: string
  checkoutUrl: string
  providerCreatedAt: Date
}) {
  const [updated] = await db
    .update(billingCheckoutPurchases)
    .set({
      paymongoCheckoutSessionId: input.paymongoCheckoutSessionId,
      checkoutUrl: input.checkoutUrl,
      providerCreatedAt: input.providerCreatedAt,
      status: "pending",
      failureCode: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(billingCheckoutPurchases.id, input.purchaseId),
        inArray(billingCheckoutPurchases.status, ["pending", "failed"]),
        isNull(billingCheckoutPurchases.paymongoCheckoutSessionId),
      ),
    )
    .returning()
  if (updated) return updated

  const [existing] = await db
    .select()
    .from(billingCheckoutPurchases)
    .where(eq(billingCheckoutPurchases.id, input.purchaseId))
    .limit(1)
  return existing ?? null
}

export async function markCheckoutPurchaseFailed(purchaseId: string, failureCode: string) {
  const [failed] = await db
    .update(billingCheckoutPurchases)
    .set({ status: "failed", failureCode: failureCode.slice(0, 100), updatedAt: new Date() })
    .where(
      and(
        eq(billingCheckoutPurchases.id, purchaseId),
        eq(billingCheckoutPurchases.status, "pending"),
        isNull(billingCheckoutPurchases.paymongoCheckoutSessionId),
      ),
    )
    .returning()
  return failed ?? null
}

export async function cancelPendingCheckoutPurchase(purchaseId: string, payerUserId: string) {
  const [cancelled] = await db
    .update(billingCheckoutPurchases)
    .set({ status: "cancelled", failureCode: "CHECKOUT_CANCELLED", updatedAt: new Date() })
    .where(
      and(
        eq(billingCheckoutPurchases.id, purchaseId),
        eq(billingCheckoutPurchases.payerUserId, payerUserId),
        eq(billingCheckoutPurchases.status, "pending"),
      ),
    )
    .returning()
  return cancelled ?? null
}
