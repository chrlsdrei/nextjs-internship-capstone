import type { BillingTarget } from "@/features/billing/billing.types"

export const checkoutProductCodes = ["user-free", "user-ai", "workspace-free", "workspace-pro"] as const

export type CheckoutProductCode = (typeof checkoutProductCodes)[number]

export type CheckoutProductDefinition = {
  code: CheckoutProductCode
  name: string
  target: BillingTarget
  currency: "PHP"
  amount: number
  interval: "monthly"
  accessDurationDays: 30
  maxProjects: number | null
  maxMembers: number | null
}

export const checkoutProductCatalog: Record<CheckoutProductCode, CheckoutProductDefinition> = {
  "user-free": {
    code: "user-free",
    name: "User Free",
    target: "user",
    currency: "PHP",
    amount: 0,
    interval: "monthly",
    accessDurationDays: 30,
    maxProjects: null,
    maxMembers: null,
  },
  "user-ai": {
    code: "user-ai",
    name: "User Pro",
    target: "user",
    currency: "PHP",
    amount: 29_900,
    interval: "monthly",
    accessDurationDays: 30,
    maxProjects: null,
    maxMembers: null,
  },
  "workspace-free": {
    code: "workspace-free",
    name: "Workspace Free",
    target: "workspace",
    currency: "PHP",
    amount: 0,
    interval: "monthly",
    accessDurationDays: 30,
    maxProjects: 3,
    maxMembers: 5,
  },
  "workspace-pro": {
    code: "workspace-pro",
    name: "Workspace Pro",
    target: "workspace",
    currency: "PHP",
    amount: 39_900,
    interval: "monthly",
    accessDurationDays: 30,
    maxProjects: 50,
    maxMembers: 100,
  },
}
