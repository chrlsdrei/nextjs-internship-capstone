import "server-only"

import { createHash } from "node:crypto"

import { getCurrentDatabaseUser } from "@/features/auth/server/session.service"
import { BillingError } from "@/features/billing/billing.error"
import { startCheckoutSchema } from "@/features/billing/billing.schema"
import type { StartCheckoutResult } from "@/features/billing/billing.types"
import {
  attachCheckoutSession,
  findActiveWorkspaceOwnerUserId,
  findCheckoutPlan,
  markCheckoutPurchaseFailed,
  reserveCheckoutPurchase,
} from "@/features/billing/server/checkout.repository"
import {
  createPaymongoCheckoutSession,
  PaymongoGatewayError,
  paymongoLivemode,
} from "@/features/billing/server/paymongo.gateway"

function applicationUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL
  if (!value) throw new BillingError("Application URL is not configured", "CHECKOUT_UNAVAILABLE", 503)
  try {
    return new URL(value)
  } catch {
    throw new BillingError("Application URL is invalid", "CHECKOUT_UNAVAILABLE", 503)
  }
}

function checkoutReference(userId: string, idempotencyKey: string, livemode: boolean) {
  const digest = createHash("sha256")
    .update(`projectflow-checkout:${userId}:${idempotencyKey}`)
    .digest("hex")
    .slice(0, 32)
    .toUpperCase()
  return `PF-${livemode ? "LIVE" : "TEST"}-${digest}`
}

function providerCreatedAt(value: number | string) {
  const date =
    typeof value === "number"
      ? new Date(value * 1000)
      : /^\d+$/.test(value)
        ? new Date(Number(value) * 1000)
        : new Date(value)
  if (Number.isNaN(date.getTime()))
    throw new BillingError("PayMongo returned an invalid date", "CHECKOUT_UNAVAILABLE", 502)
  return date
}

function assertMatchingReservation(
  purchase: NonNullable<Awaited<ReturnType<typeof reserveCheckoutPurchase>>>,
  expected: {
    planId: string
    target: "user" | "workspace"
    userId: string | null
    workspaceId: string | null
    payerUserId: string
    amount: number
    currency: string
  },
) {
  if (
    purchase.planId !== expected.planId ||
    purchase.target !== expected.target ||
    purchase.userId !== expected.userId ||
    purchase.workspaceId !== expected.workspaceId ||
    purchase.payerUserId !== expected.payerUserId ||
    purchase.amount !== expected.amount ||
    purchase.currency !== expected.currency
  ) {
    throw new BillingError(
      "This checkout key was already used for a different purchase",
      "CHECKOUT_IDEMPOTENCY_CONFLICT",
      409,
    )
  }
}

export async function startCheckout(input: unknown): Promise<StartCheckoutResult> {
  const values = startCheckoutSchema.parse(input)
  const user = await getCurrentDatabaseUser()
  const plan = await findCheckoutPlan(values.planId)
  let livemode: boolean
  try {
    livemode = paymongoLivemode()
  } catch {
    throw new BillingError("PayMongo is not configured correctly", "CHECKOUT_UNAVAILABLE", 503)
  }

  if (!plan?.active || plan.amount <= 0 || plan.currency !== "PHP")
    throw new BillingError("Checkout product is unavailable", "CHECKOUT_UNAVAILABLE", 409)
  if (plan.livemode !== livemode)
    throw new BillingError("Checkout product mode does not match PayMongo", "CHECKOUT_UNAVAILABLE", 409)

  let workspaceId: string | null = null
  if (plan.target === "workspace") {
    if (!values.workspaceId) throw new BillingError("A workspace is required", "BILLING_FORBIDDEN", 422)
    if ((await findActiveWorkspaceOwnerUserId(values.workspaceId)) !== user.id)
      throw new BillingError("Only the active workspace owner can purchase Pro access", "BILLING_FORBIDDEN")
    workspaceId = values.workspaceId
  } else if (values.workspaceId) {
    throw new BillingError("A user checkout cannot target a workspace", "CHECKOUT_IDEMPOTENCY_CONFLICT", 422)
  }

  const referenceNumber = checkoutReference(user.id, values.idempotencyKey, livemode)
  const reservationValues = {
    planId: plan.id,
    target: plan.target,
    userId: plan.target === "user" ? user.id : null,
    workspaceId,
    payerUserId: user.id,
    referenceNumber,
    amount: plan.amount,
    currency: plan.currency,
  }
  const purchase = await reserveCheckoutPurchase(reservationValues)
  if (!purchase) throw new BillingError("Unable to reserve checkout", "CHECKOUT_UNAVAILABLE", 503)
  assertMatchingReservation(purchase, reservationValues)

  if (purchase.status === "paid")
    throw new BillingError("This checkout purchase is already paid", "CHECKOUT_ALREADY_COMPLETED", 409)
  if (purchase.status === "cancelled" || purchase.status === "expired")
    throw new BillingError("Start a new checkout request for this purchase", "CHECKOUT_IDEMPOTENCY_CONFLICT", 409)
  if (purchase.checkoutUrl && purchase.paymongoCheckoutSessionId)
    return { purchaseId: purchase.id, checkoutUrl: purchase.checkoutUrl }

  const appUrl = applicationUrl()
  try {
    const provider = await createPaymongoCheckoutSession({
      target: plan.target,
      amount: plan.amount,
      currency: "PHP",
      referenceNumber,
      successUrl: new URL("/subscription?checkout=success", appUrl).toString(),
      cancelUrl: new URL("/subscription?checkout=cancelled", appUrl).toString(),
      idempotencyKey: `checkout:${referenceNumber}`,
    })
    const saved = await attachCheckoutSession({
      purchaseId: purchase.id,
      paymongoCheckoutSessionId: provider.id,
      checkoutUrl: provider.checkoutUrl,
      providerCreatedAt: providerCreatedAt(provider.createdAt),
    })
    if (!saved?.checkoutUrl || !saved.paymongoCheckoutSessionId)
      throw new BillingError("Unable to save the Checkout Session", "CHECKOUT_UNAVAILABLE", 503)
    return { purchaseId: saved.id, checkoutUrl: saved.checkoutUrl }
  } catch (error) {
    const failureCode =
      error instanceof PaymongoGatewayError
        ? error.code
        : error instanceof BillingError
          ? error.code
          : "CHECKOUT_PROVIDER_FAILURE"
    await markCheckoutPurchaseFailed(purchase.id, failureCode)
    if (error instanceof BillingError) throw error
    throw new BillingError(
      error instanceof PaymongoGatewayError ? error.message : "Unable to start PayMongo checkout",
      "CHECKOUT_UNAVAILABLE",
      502,
    )
  }
}
