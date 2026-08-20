"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { BillingError } from "@/features/billing/billing.error"
import { cancelCheckout } from "@/features/billing/services/checkout.service"
import { type ActionState, actionError, actionSuccess } from "@/lib/action-state"

export async function cancelCheckoutAction(input: unknown): Promise<ActionState> {
  try {
    await cancelCheckout(input)
    revalidatePath("/subscription")
    return actionSuccess(undefined, "Checkout cancelled. You can start another attempt.")
  } catch (error) {
    if (error instanceof z.ZodError) return actionError("The checkout reference is invalid")
    if (error instanceof BillingError) return actionError(error.message, undefined, { code: error.code })
    return actionError("Unable to cancel checkout", undefined, { code: "CHECKOUT_CANCEL_FAILED" })
  }
}
