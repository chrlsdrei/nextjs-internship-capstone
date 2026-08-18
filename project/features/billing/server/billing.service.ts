import "server-only"

import { getCurrentDatabaseUser } from "@/features/auth/server/session.service"
import { BillingError } from "@/features/billing/billing.error"
import {
  billingStatusSchema,
  cancelSubscriptionSchema,
  startSubscriptionSchema,
} from "@/features/billing/billing.schema"
import type { BillingPlanDto, BillingStatus, SubscriptionDto } from "@/features/billing/billing.types"
import {
  beginWebhookEvent,
  findBillingCustomer,
  findBillingPlan,
  findCurrentUserSubscription,
  findCurrentWorkspaceSubscription,
  findSubscriptionById,
  findWorkspaceOwnerUserId,
  finishWebhookEvent,
  insertBillingCustomer,
  insertBillingSubscription,
  listActiveBillingPlans,
  setSubscriptionTier,
  updateSubscriptionFromProvider,
} from "@/features/billing/server/billing.repository"
import {
  cancelPaymongoSubscription,
  createPaymongoCustomer,
  createPaymongoSubscription,
  paymongoLivemode,
  retrievePaymongoPaymentIntent,
  retrievePaymongoSubscription,
} from "@/features/billing/server/paymongo.gateway"

function planDto(plan: Awaited<ReturnType<typeof findBillingPlan>> & object): BillingPlanDto {
  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    target: plan.target,
    currency: plan.currency,
    amount: plan.amount,
    interval: plan.interval,
    maxProjects: plan.maxProjects,
    maxMembers: plan.maxMembers,
  }
}

function addPeriod(date: Date, interval: "monthly" | "yearly") {
  const result = new Date(date)
  if (interval === "monthly") result.setUTCMonth(result.getUTCMonth() + 1)
  else result.setUTCFullYear(result.getUTCFullYear() + 1)
  return result
}

export async function getBillingPlans() {
  return (await listActiveBillingPlans()).map(planDto)
}

export async function getAccountBilling() {
  const user = await getCurrentDatabaseUser()
  const current = await findCurrentUserSubscription(user.id)
  return {
    plans: (await listActiveBillingPlans("user")).map(planDto),
    subscription: current ? subscriptionDto(current, true) : null,
  }
}

export async function getWorkspaceBilling(workspaceId: string) {
  const user = await getCurrentDatabaseUser()
  const ownerUserId = await findWorkspaceOwnerUserId(workspaceId)
  if (!ownerUserId) throw new BillingError("Workspace not found", "BILLING_FORBIDDEN", 404)
  const current = await findCurrentWorkspaceSubscription(workspaceId)
  const canManage = ownerUserId === user.id
  return {
    plans: (await listActiveBillingPlans("workspace")).map(planDto),
    subscription: current ? subscriptionDto(current, canManage) : null,
    canManage,
  }
}

export async function startSubscription(input: unknown) {
  const values = startSubscriptionSchema.parse(input)
  const user = await getCurrentDatabaseUser()
  const plan = await findBillingPlan(values.planId)
  if (!plan?.active || !plan.paymongoPlanId)
    throw new BillingError("Billing plan is unavailable", "BILLING_PROVIDER_ERROR", 409)
  if (plan.livemode !== paymongoLivemode())
    throw new BillingError(
      "Billing plan mode does not match the configured PayMongo key",
      "BILLING_PROVIDER_ERROR",
      409,
    )

  let workspaceId: string | null = null
  if (plan.target === "workspace") {
    if (!values.workspaceId) throw new BillingError("A workspace is required", "BILLING_FORBIDDEN", 422)
    if ((await findWorkspaceOwnerUserId(values.workspaceId)) !== user.id) {
      throw new BillingError("Only the workspace owner can manage billing", "BILLING_FORBIDDEN")
    }
    workspaceId = values.workspaceId
  }

  const existing =
    plan.target === "user"
      ? await findCurrentUserSubscription(user.id)
      : await findCurrentWorkspaceSubscription(workspaceId as string)
  if (existing && ["active", "past_due", "incomplete"].includes(existing.subscription.status)) {
    throw new BillingError("This subscription is already active or awaiting payment", "BILLING_PROVIDER_ERROR", 409)
  }

  let customer = await findBillingCustomer(user.id, plan.livemode)
  if (!customer) {
    const provider = await createPaymongoCustomer({
      name: user.name,
      email: user.email,
      idempotencyKey: `customer:${user.id}:${plan.livemode}`,
    })
    customer = await insertBillingCustomer(user.id, provider.data.id, plan.livemode)
  }
  if (!customer) throw new BillingError("Unable to create the billing customer", "BILLING_PROVIDER_ERROR", 502)

  const provider = await createPaymongoSubscription({
    customerId: customer.paymongoCustomerId,
    planId: plan.paymongoPlanId,
    idempotencyKey: values.idempotencyKey,
  })
  const now = new Date()
  const subscription = await insertBillingSubscription({
    planId: plan.id,
    target: plan.target,
    userId: plan.target === "user" ? user.id : null,
    workspaceId,
    payerUserId: user.id,
    billingCustomerId: customer.id,
    paymongoSubscriptionId: provider.data.id,
    startsAt: now,
    endsAt: addPeriod(now, plan.interval),
  })
  const attributes = provider.data.attributes as {
    setup_intent?: { next_action_url?: string | null }
    latest_invoice?: { payment_intent?: { id?: string; next_action_url?: string | null } }
  }
  const paymentIntentId = attributes.latest_invoice?.payment_intent?.id ?? null
  const paymentIntent = paymentIntentId ? await retrievePaymongoPaymentIntent(paymentIntentId) : null
  return {
    subscriptionId: subscription.id,
    status: subscription.status,
    nextActionUrl:
      attributes.setup_intent?.next_action_url ??
      attributes.latest_invoice?.payment_intent?.next_action_url ??
      paymentIntent?.data.attributes.next_action?.redirect?.url ??
      null,
    paymentIntentId,
    clientKey: paymentIntent?.data.attributes.client_key ?? null,
  }
}

export async function cancelSubscription(input: unknown) {
  const values = cancelSubscriptionSchema.parse(input)
  const user = await getCurrentDatabaseUser()
  const current = await findSubscriptionById(values.subscriptionId)
  if (!current) throw new BillingError("Subscription not found", "BILLING_FORBIDDEN", 404)
  const mayManage =
    current.subscription.target === "user"
      ? current.subscription.userId === user.id
      : current.subscription.workspaceId !== null &&
        (await findWorkspaceOwnerUserId(current.subscription.workspaceId)) === user.id
  if (!mayManage) throw new BillingError("You cannot manage this subscription", "BILLING_FORBIDDEN")
  await cancelPaymongoSubscription(current.subscription.paymongoSubscriptionId, values.reason)
  const updated = await updateSubscriptionFromProvider({
    paymongoSubscriptionId: current.subscription.paymongoSubscriptionId,
    status: "cancelled",
    providerUpdatedAt: new Date(),
    cancelledAt: new Date(),
    cancellationReason: values.reason,
  })
  if (updated) {
    await setSubscriptionTier({
      target: updated.target,
      userId: updated.userId,
      workspaceId: updated.workspaceId,
      tier: "free",
    })
  }
}

type PaymongoWebhook = {
  data: {
    id: string
    attributes: {
      type: string
      created_at: number
      data: {
        id: string
        attributes: {
          resource_id?: string
          subscription_id?: string
          status?: BillingStatus
          updated_at?: number
          next_billing_schedule?: string | null
          cancelled_at?: number | null
          cancellation_reason?: string | null
        }
      }
    }
  }
}

export async function processPaymongoWebhook(event: PaymongoWebhook, rawBody: string) {
  const type = event.data.attributes.type
  const providerCreatedAt = new Date(event.data.attributes.created_at * 1000)
  const ledger = await beginWebhookEvent({
    providerEventId: event.data.id,
    eventType: type,
    providerCreatedAt,
    rawBody,
  })
  if (!ledger) return { duplicate: true }
  try {
    const resource = event.data.attributes.data
    const subscriptionId = resource.attributes.subscription_id ?? resource.attributes.resource_id ?? resource.id
    const supported = new Set([
      "subscription.activated",
      "subscription.updated",
      "subscription.past_due",
      "subscription.unpaid",
      "subscription.cancelled",
      "subscription.incomplete_cancelled",
    ])
    let providerAttributes = resource.attributes
    const isPaidInvoice = type === "subscription.invoice.paid"
    const isFailedInvoice = type === "subscription.invoice.payment_failed"
    if ((isPaidInvoice || isFailedInvoice) && subscriptionId) {
      const fresh = await retrievePaymongoSubscription(subscriptionId)
      providerAttributes = fresh.data.attributes as typeof providerAttributes
    }
    const parsedStatus = billingStatusSchema.safeParse(providerAttributes.status)
    if ((supported.has(type) || isPaidInvoice || isFailedInvoice) && parsedStatus.success) {
      const nextBillingAt = providerAttributes.next_billing_schedule
        ? new Date(providerAttributes.next_billing_schedule)
        : null
      const updated = await updateSubscriptionFromProvider({
        paymongoSubscriptionId: subscriptionId,
        status: parsedStatus.data,
        providerUpdatedAt: new Date((providerAttributes.updated_at ?? event.data.attributes.created_at) * 1000),
        nextBillingAt,
        periodEndsAt: nextBillingAt,
        cancelledAt: providerAttributes.cancelled_at ? new Date(providerAttributes.cancelled_at * 1000) : null,
        cancellationReason: providerAttributes.cancellation_reason,
      })
      if (updated) {
        const grantsPro = parsedStatus.data === "active" || parsedStatus.data === "past_due"
        await setSubscriptionTier({
          target: updated.target,
          userId: updated.userId,
          workspaceId: updated.workspaceId,
          tier: grantsPro ? "pro" : "free",
          extend: grantsPro && (type === "subscription.activated" || isPaidInvoice),
        })
      }
    }
    await finishWebhookEvent(event.data.id)
    return { duplicate: false }
  } catch (error) {
    await finishWebhookEvent(event.data.id, error instanceof Error ? error.name : "UNKNOWN")
    throw error
  }
}

export function subscriptionDto(
  current: NonNullable<Awaited<ReturnType<typeof findSubscriptionById>>>,
  canManage: boolean,
): SubscriptionDto {
  return {
    id: current.subscription.id,
    plan: planDto(current.plan),
    target: current.subscription.target,
    status: current.subscription.status,
    workspaceId: current.subscription.workspaceId,
    currentPeriodStartsAt: current.subscription.currentPeriodStartsAt.toISOString(),
    currentPeriodEndsAt: current.subscription.currentPeriodEndsAt.toISOString(),
    nextBillingAt: current.subscription.nextBillingAt?.toISOString() ?? null,
    canManage,
  }
}
