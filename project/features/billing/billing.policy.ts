import type { SubscriptionTier } from "@/features/billing/billing.types"

export const SUBSCRIPTION_PERIOD_DAYS = 30

export const DEFAULT_SUBSCRIPTION_LIMITS = {
  workspace: {
    freeMaxProjects: 3,
    freeMaxMembers: 5,
    proMaxProjects: 50,
    proMaxMembers: 100,
  },
} as const

export function tierGrantsAccess(tier: SubscriptionTier, endsAt: Date | null, now = new Date()) {
  return tier === "pro" && endsAt !== null && endsAt > now
}
