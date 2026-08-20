"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { BillingError } from "@/features/billing/billing.error"
import type { StartCheckoutResult } from "@/features/billing/billing.types"
import { startCheckout } from "@/features/billing/services/checkout.service"
import { type ActionState, actionError, actionSuccess } from "@/lib/action-state"

function failure(error: unknown): ActionState {
  if (error instanceof z.ZodError) return actionError("Check the highlighted fields", error.flatten().fieldErrors)
  if (error instanceof BillingError) return actionError(error.message, undefined, { code: error.code })
  return actionError("Unable to start checkout. Please try again.", undefined, {
    code: "BILLING_PROVIDER_ERROR",
  })
}

export async function startCheckoutAction(input: unknown): Promise<ActionState<StartCheckoutResult>> {
  try {
    const result = await startCheckout(input)
    revalidatePath("/subscription")
    return actionSuccess(result, "Continue to PayMongo to complete your purchase.")
  } catch (error) {
    return failure(error)
  }
}
