"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { BillingError } from "@/features/billing/billing.error"
import { cancelSubscription, startSubscription } from "@/features/billing/server/billing.service"
import { type ActionState, actionError, actionSuccess } from "@/lib/action-state"

function failure(error: unknown): ActionState {
  if (error instanceof z.ZodError) return actionError("Check the highlighted fields", error.flatten().fieldErrors)
  if (error instanceof BillingError) return actionError(error.message, undefined, { code: error.code })
  return actionError(error instanceof Error ? error.message : "Billing request failed", undefined, {
    code: "BILLING_PROVIDER_ERROR",
  })
}

export async function startSubscriptionAction(
  input: unknown,
): Promise<ActionState<{ nextActionUrl: string | null; paymentIntentId: string | null; clientKey: string | null }>> {
  try {
    const result = await startSubscription(input)
    revalidatePath("/settings")
    revalidatePath("/workspaces")
    return actionSuccess(
      { nextActionUrl: result.nextActionUrl, paymentIntentId: result.paymentIntentId, clientKey: result.clientKey },
      "Subscription created. Complete the payment to activate it.",
    )
  } catch (error) {
    return failure(error)
  }
}

export async function cancelSubscriptionAction(input: unknown): Promise<ActionState> {
  try {
    await cancelSubscription(input)
    revalidatePath("/settings")
    revalidatePath("/workspaces")
    return actionSuccess(undefined, "Subscription cancelled")
  } catch (error) {
    return failure(error)
  }
}
