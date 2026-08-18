import "server-only"

import { getCurrentDatabaseUser } from "@/features/auth/server/session.service"
import { BillingError } from "@/features/billing/billing.error"
import type { BillingPlanDto } from "@/features/billing/billing.types"
import {
  findUserSubscriptionTier,
  findWorkspaceOwnerUserId,
  findWorkspaceSubscriptionTier,
  listActiveBillingPlans,
} from "@/features/billing/server/billing.repository"

function planDto(plan: Awaited<ReturnType<typeof listActiveBillingPlans>>[number]): BillingPlanDto {
  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    target: plan.target,
    currency: plan.currency,
    amount: plan.amount,
    interval: plan.interval,
    maxProjects: plan.maxProjects,
    maxMembers: plan.maxMembers,
  }
}

export async function getBillingPlans() {
  return (await listActiveBillingPlans()).map(planDto)
}

export async function getAccountBilling() {
  const user = await getCurrentDatabaseUser()
  const [plans, access] = await Promise.all([listActiveBillingPlans("user"), findUserSubscriptionTier(user.id)])
  return {
    plans: plans.map(planDto),
    access: {
      tier: access?.tier ?? "free",
      periodEndsAt: access?.endsAt?.toISOString() ?? null,
    },
  }
}

export async function getWorkspaceBilling(workspaceId: string) {
  const user = await getCurrentDatabaseUser()
  const [ownerUserId, plans, access] = await Promise.all([
    findWorkspaceOwnerUserId(workspaceId),
    listActiveBillingPlans("workspace"),
    findWorkspaceSubscriptionTier(workspaceId),
  ])
  if (!ownerUserId) throw new BillingError("Workspace not found", "BILLING_FORBIDDEN", 404)
  return {
    plans: plans.map(planDto),
    access: {
      tier: access?.tier ?? "free",
      periodEndsAt: access?.endsAt?.toISOString() ?? null,
    },
    canManage: ownerUserId === user.id,
  }
}
