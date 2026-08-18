export type BillingTarget = "user" | "workspace"
export type SubscriptionTier = "free" | "pro"

export const checkoutPurchaseStatuses = ["pending", "paid", "cancelled", "expired", "failed"] as const
export type CheckoutPurchaseStatus = (typeof checkoutPurchaseStatuses)[number]

export type BillingPlanDto = {
  id: string
  code: string
  name: string
  target: BillingTarget
  currency: string
  amount: number
  interval: "monthly" | "yearly"
  maxProjects: number | null
  maxMembers: number | null
}

export type CheckoutPurchaseDto = {
  id: string
  target: BillingTarget
  plan: BillingPlanDto
  workspaceId: string | null
  status: CheckoutPurchaseStatus
  amount: number
  currency: string
  paidAt: string | null
  accessEndsAt: string | null
}

export type StartCheckoutResult = {
  purchaseId: string
  checkoutUrl: string
}

export type BillingAccessDto = {
  tier: SubscriptionTier
  periodEndsAt: string | null
}

export type UserAiEntitlementDto = {
  tier: SubscriptionTier
  subscribed: boolean
  periodEndsAt: string | null
}

export type WorkspaceEntitlementDto = {
  tier: SubscriptionTier
  subscribed: boolean
  maxProjects: number | null
  maxMembers: number | null
  projectCount: number
  memberCount: number
  readOnly: boolean
  canManageBilling: boolean
  periodEndsAt: string | null
}
