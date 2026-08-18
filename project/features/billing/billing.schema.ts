import { z } from "zod"

import { checkoutPurchaseStatuses } from "@/features/billing/billing.types"

export const billingTargetSchema = z.enum(["user", "workspace"])
export const checkoutPurchaseStatusSchema = z.enum(checkoutPurchaseStatuses)
export const billingStatusSchema = z.enum([
  "incomplete",
  "incomplete_cancelled",
  "active",
  "past_due",
  "unpaid",
  "cancelled",
])

export const startCheckoutSchema = z
  .object({
    planId: z.uuid("Plan ID must be a valid UUID"),
    workspaceId: z.uuid("Workspace ID must be a valid UUID").optional(),
    idempotencyKey: z.string().trim().min(16).max(200),
  })
  .strict()

/** @deprecated Remove with the recurring PayMongo flow in Step 7. */
export const startSubscriptionSchema = z.object({
  planId: z.uuid("Plan ID must be a valid UUID"),
  workspaceId: z.uuid("Workspace ID must be a valid UUID").optional(),
  idempotencyKey: z.string().trim().min(16).max(200),
})

export const cancelSubscriptionSchema = z.object({
  subscriptionId: z.uuid("Subscription ID must be a valid UUID"),
  reason: z.enum(["too_expensive", "missing_features", "switched_service", "unused", "other"]),
})

export type StartCheckoutInput = z.infer<typeof startCheckoutSchema>
/** @deprecated Remove with the recurring PayMongo flow in Step 7. */
export type StartSubscriptionInput = z.infer<typeof startSubscriptionSchema>
