import { z } from "zod"

import { checkoutPurchaseStatuses } from "@/features/billing/billing.types"

export const billingTargetSchema = z.enum(["user", "workspace"])
export const checkoutPurchaseStatusSchema = z.enum(checkoutPurchaseStatuses)

export const startCheckoutSchema = z
  .object({
    planId: z.uuid("Plan ID must be a valid UUID"),
    workspaceId: z.uuid("Workspace ID must be a valid UUID").optional(),
    idempotencyKey: z.string().trim().min(16).max(200),
  })
  .strict()

export type StartCheckoutInput = z.infer<typeof startCheckoutSchema>

export const cancelCheckoutSchema = z.object({ purchaseId: z.uuid("Purchase ID must be a valid UUID") }).strict()

export type CancelCheckoutInput = z.infer<typeof cancelCheckoutSchema>
