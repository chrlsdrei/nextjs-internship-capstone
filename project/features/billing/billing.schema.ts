import { z } from "zod"

export const billingTargetSchema = z.enum(["user", "workspace"])
export const billingStatusSchema = z.enum([
  "incomplete",
  "incomplete_cancelled",
  "active",
  "past_due",
  "unpaid",
  "cancelled",
])

export const startSubscriptionSchema = z.object({
  planId: z.uuid("Plan ID must be a valid UUID"),
  workspaceId: z.uuid("Workspace ID must be a valid UUID").optional(),
  idempotencyKey: z.string().trim().min(16).max(200),
})

export const cancelSubscriptionSchema = z.object({
  subscriptionId: z.uuid("Subscription ID must be a valid UUID"),
  reason: z.enum(["too_expensive", "missing_features", "switched_service", "unused", "other"]),
})

export type StartSubscriptionInput = z.infer<typeof startSubscriptionSchema>
