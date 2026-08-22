import "server-only"

import { getCurrentDatabaseUser } from "@/features/auth/services/session.service"
import { DEFAULT_SUBSCRIPTION_LIMITS } from "@/features/billing/billing.policy"
import type {
  BillingPlanDto,
  CheckoutPurchaseDto,
  ProAccessSource,
  SubscriptionCatalogDto,
  SubscriptionPageDto,
  SubscriptionTier,
} from "@/features/billing/billing.types"
import { paymongoLivemode } from "@/features/billing/gateways/paymongo.gateway"
import {
  countWorkspaceCapacity,
  findUserSubscriptionTier,
  findWorkspaceSubscriptionTier,
  listActiveBillingPlans,
} from "@/features/billing/repositories/billing.repository"
import {
  findLatestPaidUserCheckoutPurchase,
  findLatestPaidWorkspaceCheckoutPurchase,
  findLatestUserCheckoutPurchase,
  findLatestWorkspaceCheckoutPurchase,
  listActiveOwnedWorkspaces,
} from "@/features/billing/repositories/subscription-page.repository"

type BillingPlanRow = Awaited<ReturnType<typeof listActiveBillingPlans>>[number]
type CheckoutPurchaseRow = NonNullable<Awaited<ReturnType<typeof findLatestUserCheckoutPurchase>>>

function toPlanDto(plan: BillingPlanRow): BillingPlanDto {
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

function toCatalog(plans: BillingPlanRow[]): SubscriptionCatalogDto {
  const newest = (candidates: BillingPlanRow[]) =>
    candidates.reduce<BillingPlanRow | null>(
      (selected, plan) => (!selected || plan.version > selected.version ? plan : selected),
      null,
    )

  const free = newest(plans.filter((plan) => plan.amount === 0))
  const pro = newest(plans.filter((plan) => plan.amount > 0))
  return { free: free ? toPlanDto(free) : null, pro: pro ? toPlanDto(pro) : null }
}

function toPurchaseDto(row: CheckoutPurchaseRow | null): CheckoutPurchaseDto | null {
  if (!row) return null
  return {
    id: row.purchase.id,
    target: row.purchase.target,
    plan: toPlanDto(row.plan),
    workspaceId: row.purchase.workspaceId,
    status: row.purchase.status,
    amount: row.purchase.amount,
    currency: row.purchase.currency,
    paidAt: row.purchase.paidAt?.toISOString() ?? null,
    accessEndsAt: row.purchase.accessEndsAt?.toISOString() ?? null,
    checkoutUrl: row.purchase.checkoutUrl,
  }
}

function limitsForTier(tier: SubscriptionTier, catalog: SubscriptionCatalogDto) {
  const configured = tier === "pro" ? catalog.pro : catalog.free
  const defaults = DEFAULT_SUBSCRIPTION_LIMITS.workspace
  return {
    maxProjects: configured?.maxProjects ?? (tier === "pro" ? defaults.proMaxProjects : defaults.freeMaxProjects),
    maxMembers: configured?.maxMembers ?? (tier === "pro" ? defaults.proMaxMembers : defaults.freeMaxMembers),
  }
}

function proAccessSource(
  periodEndsAt: Date | null | undefined,
  latestPaidPurchase: CheckoutPurchaseRow | null,
): ProAccessSource {
  if (!periodEndsAt) return null
  return latestPaidPurchase?.purchase.accessEndsAt?.getTime() === periodEndsAt.getTime() ? "purchase" : "manual"
}

function proExpired(tier: SubscriptionTier, periodEndsAt: Date | null | undefined) {
  return tier === "free" && Boolean(periodEndsAt && periodEndsAt <= new Date())
}

export async function getSubscriptionPageData(): Promise<SubscriptionPageDto> {
  const user = await getCurrentDatabaseUser()
  let livemode: boolean | null = null
  try {
    livemode = paymongoLivemode()
  } catch {
    livemode = null
  }
  const [userAccess, ownedWorkspaces, latestUserPurchase, latestPaidUserPurchase] = await Promise.all([
    findUserSubscriptionTier(user.id),
    listActiveOwnedWorkspaces(user.id),
    findLatestUserCheckoutPurchase(user.id),
    findLatestPaidUserCheckoutPurchase(user.id),
  ])
  const [userPlans, workspacePlans] =
    livemode === null
      ? [[], []]
      : await Promise.all([listActiveBillingPlans("user", livemode), listActiveBillingPlans("workspace", livemode)])
  const userCatalog = toCatalog(userPlans)
  const workspaceCatalog = toCatalog(workspacePlans)

  const workspaceData = await Promise.all(
    ownedWorkspaces.map(async (workspace) => {
      const [access, usage, latestPurchase, latestPaidPurchase] = await Promise.all([
        findWorkspaceSubscriptionTier(workspace.id),
        countWorkspaceCapacity(workspace.id),
        findLatestWorkspaceCheckoutPurchase(workspace.id),
        findLatestPaidWorkspaceCheckoutPurchase(workspace.id),
      ])
      const tier = access?.tier ?? "free"
      const capacity = limitsForTier(tier, workspaceCatalog)
      return {
        id: workspace.id,
        name: workspace.name,
        tier,
        periodEndsAt: access?.endsAt?.toISOString() ?? null,
        proAccessSource: proAccessSource(access?.endsAt, latestPaidPurchase),
        proExpired: proExpired(tier, access?.endsAt),
        capacity,
        usage,
        readOnly:
          tier === "free" && (usage.projectCount > capacity.maxProjects || usage.memberCount > capacity.maxMembers),
        latestPurchase: toPurchaseDto(latestPurchase),
      }
    }),
  )

  return {
    checkout: { available: livemode !== null, mode: livemode === null ? null : livemode ? "live" : "test" },
    user: {
      tier: userAccess?.tier ?? "free",
      periodEndsAt: userAccess?.endsAt?.toISOString() ?? null,
      proAccessSource: proAccessSource(userAccess?.endsAt, latestPaidUserPurchase),
      proExpired: proExpired(userAccess?.tier ?? "free", userAccess?.endsAt),
      latestPurchase: toPurchaseDto(latestUserPurchase),
    },
    catalog: { user: userCatalog, workspace: workspaceCatalog },
    ownedWorkspaces: workspaceData,
  }
}
