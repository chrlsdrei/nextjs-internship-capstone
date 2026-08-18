export type BillingTarget = "user" | "workspace"
export type BillingStatus = "incomplete" | "incomplete_cancelled" | "active" | "past_due" | "unpaid" | "cancelled"
export type SubscriptionTier = "free" | "pro"

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

export type SubscriptionDto = {
  id: string
  plan: BillingPlanDto
  target: BillingTarget
  status: BillingStatus
  workspaceId: string | null
  currentPeriodStartsAt: string
  currentPeriodEndsAt: string
  nextBillingAt: string | null
  canManage: boolean
}

export type UserAiEntitlementDto = {
  tier: SubscriptionTier
  subscribed: boolean
  status: BillingStatus | null
  periodEndsAt: string | null
}

export type WorkspaceEntitlementDto = {
  tier: SubscriptionTier
  subscribed: boolean
  status: BillingStatus | null
  maxProjects: number | null
  maxMembers: number | null
  projectCount: number
  memberCount: number
  readOnly: boolean
  canManageBilling: boolean
  periodEndsAt: string | null
}
