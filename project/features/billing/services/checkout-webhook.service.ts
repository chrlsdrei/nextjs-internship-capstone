import "server-only"

import { parsePaymongoWebhook } from "@/features/billing/checkout-webhook.schema"
import { paymongoLivemode } from "@/features/billing/gateways/paymongo.gateway"
import {
  findCheckoutPurchaseForWebhook,
  fulfillCheckoutPurchase,
  recordCheckoutWebhookFailure,
} from "@/features/billing/repositories/checkout-webhook.repository"

export type CheckoutWebhookErrorCode =
  | "CHECKOUT_EVENT_INVALID"
  | "CHECKOUT_MODE_MISMATCH"
  | "CHECKOUT_PAYMENT_MISMATCH"
  | "CHECKOUT_PURCHASE_NOT_FOUND"
  | "CHECKOUT_PURCHASE_STATE_INVALID"
  | "CHECKOUT_SUBJECT_MISMATCH"

export class CheckoutWebhookError extends Error {
  constructor(
    message: string,
    public readonly code: CheckoutWebhookErrorCode,
    public readonly status: number,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = "CheckoutWebhookError"
  }
}

function checkoutError(message: string, code: CheckoutWebhookErrorCode, status = 400) {
  return new CheckoutWebhookError(message, code, status)
}

export async function processCheckoutWebhook(payload: unknown, rawBody: string) {
  let event: ReturnType<typeof parsePaymongoWebhook>
  try {
    event = parsePaymongoWebhook(payload)
  } catch (error) {
    throw new CheckoutWebhookError("Invalid PayMongo webhook payload", "CHECKOUT_EVENT_INVALID", 400, {
      cause: error,
    })
  }

  if (event.type === "ignored") return { ignored: true, eventType: event.eventType }

  try {
    if (event.livemode !== paymongoLivemode())
      throw checkoutError("Checkout event mode does not match this environment", "CHECKOUT_MODE_MISMATCH")

    const row = await findCheckoutPurchaseForWebhook(event.referenceNumber)
    if (!row) throw checkoutError("Checkout purchase was not found", "CHECKOUT_PURCHASE_NOT_FOUND", 404)

    const { plan, purchase } = row
    if (purchase.status === "paid") return { ignored: false, duplicate: true, purchaseId: purchase.id }
    if (plan.target !== purchase.target || plan.livemode !== event.livemode)
      throw checkoutError("Checkout purchase does not match its catalog product", "CHECKOUT_SUBJECT_MISMATCH")
    if (
      (purchase.target === "user" &&
        (!purchase.userId || purchase.workspaceId !== null || purchase.userId !== purchase.payerUserId)) ||
      (purchase.target === "workspace" && (!purchase.workspaceId || purchase.userId !== null))
    )
      throw checkoutError("Checkout purchase has an invalid entitlement subject", "CHECKOUT_SUBJECT_MISMATCH")
    if (
      (purchase.paymongoCheckoutSessionId !== null && purchase.paymongoCheckoutSessionId !== event.checkoutSessionId) ||
      purchase.referenceNumber !== event.referenceNumber ||
      purchase.amount !== event.amount ||
      purchase.currency.toUpperCase() !== event.currency
    )
      throw checkoutError("Checkout payment does not match the reserved purchase", "CHECKOUT_PAYMENT_MISMATCH")

    const result = await fulfillCheckoutPurchase({
      purchaseId: purchase.id,
      target: purchase.target,
      userId: purchase.userId,
      workspaceId: purchase.workspaceId,
      providerEventId: event.providerEventId,
      providerCreatedAt: event.providerCreatedAt,
      rawBody,
      checkoutSessionId: event.checkoutSessionId,
      referenceNumber: event.referenceNumber,
      paidAt: event.paidAt,
    })

    return {
      ignored: false,
      duplicate: !result.claimed || !result.fulfilled,
      purchaseId: result.purchase_id ?? purchase.id,
      accessEndsAt: result.access_ends_at
        ? new Date(result.access_ends_at).toISOString()
        : purchase.accessEndsAt?.toISOString(),
    }
  } catch (error) {
    const normalized =
      error instanceof CheckoutWebhookError
        ? error
        : new CheckoutWebhookError("Checkout fulfillment failed", "CHECKOUT_EVENT_INVALID", 500, { cause: error })
    await recordCheckoutWebhookFailure({
      providerEventId: event.providerEventId,
      eventType: event.type,
      providerCreatedAt: event.providerCreatedAt,
      rawBody,
      errorCode: normalized.code,
    }).catch(() => undefined)
    throw normalized
  }
}
