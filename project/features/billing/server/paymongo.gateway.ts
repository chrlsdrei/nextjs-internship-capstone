import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"
import { z } from "zod"

const PAYMONGO_API = "https://api.paymongo.com"
const PAYMONGO_REQUEST_TIMEOUT_MS = 10_000

const checkoutPaymentMethods = [
  "billease",
  "brankas",
  "card",
  "dob",
  "gcash",
  "grab_pay",
  "paymaya",
  "qrph",
  "shopee_pay",
] as const

export type PaymongoCheckoutPaymentMethod = (typeof checkoutPaymentMethods)[number]

export type PaymongoGatewayErrorCode =
  | "PAYMONGO_CONFIGURATION_ERROR"
  | "PAYMONGO_AUTHENTICATION_ERROR"
  | "PAYMONGO_INVALID_REQUEST"
  | "PAYMONGO_MODE_MISMATCH"
  | "PAYMONGO_NETWORK_ERROR"
  | "PAYMONGO_NO_PAYMENT_METHODS"
  | "PAYMONGO_PROVIDER_ERROR"
  | "PAYMONGO_RATE_LIMITED"
  | "PAYMONGO_RESPONSE_INVALID"

export class PaymongoGatewayError extends Error {
  constructor(
    message: string,
    public readonly code: PaymongoGatewayErrorCode,
    public readonly providerStatus?: number,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = "PaymongoGatewayError"
  }
}

const checkoutSessionResponseSchema = z.object({
  data: z.object({
    id: z.string().min(1),
    type: z.literal("checkout_session"),
    attributes: z.object({
      checkout_url: z.url(),
      livemode: z.boolean(),
      created_at: z.union([z.number(), z.string()]),
    }),
  }),
})

const checkoutInputSchema = z.object({
  target: z.enum(["user", "workspace"]),
  amount: z.number().int().positive(),
  currency: z.literal("PHP"),
  referenceNumber: z.string().trim().min(1).max(255),
  successUrl: z.url(),
  cancelUrl: z.url(),
  idempotencyKey: z.string().trim().min(16).max(200),
})

export type CreatePaymongoCheckoutSessionInput = z.infer<typeof checkoutInputSchema>

export type PaymongoCheckoutSession = {
  id: string
  checkoutUrl: string
  livemode: boolean
  createdAt: number | string
  paymentMethodTypes: PaymongoCheckoutPaymentMethod[]
}

function secretKey() {
  const value = process.env.PAYMONGO_SECRET_KEY
  if (!value) throw new PaymongoGatewayError("PayMongo is not configured", "PAYMONGO_CONFIGURATION_ERROR")
  return value
}

function authHeader() {
  return `Basic ${Buffer.from(`${secretKey()}:`).toString("base64")}`
}

async function request<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}) {
  const headers = new Headers(init.headers)
  headers.set("Authorization", authHeader())
  headers.set("Content-Type", "application/json")
  if (init.idempotencyKey) headers.set("Idempotency-Key", init.idempotencyKey)

  let response: Response
  try {
    response = await fetch(`${PAYMONGO_API}${path}`, {
      ...init,
      headers,
      signal: init.signal ?? AbortSignal.timeout(PAYMONGO_REQUEST_TIMEOUT_MS),
      cache: "no-store",
    })
  } catch (error) {
    throw new PaymongoGatewayError("Unable to reach PayMongo", "PAYMONGO_NETWORK_ERROR", undefined, {
      cause: error,
    })
  }

  const body = (await response.json().catch(() => null)) as T | null
  if (!response.ok) {
    if (response.status === 400 || response.status === 422)
      throw new PaymongoGatewayError(
        "PayMongo rejected the checkout request",
        "PAYMONGO_INVALID_REQUEST",
        response.status,
      )
    if (response.status === 401 || response.status === 403)
      throw new PaymongoGatewayError(
        "PayMongo rejected the configured credentials",
        "PAYMONGO_AUTHENTICATION_ERROR",
        response.status,
      )
    if (response.status === 429)
      throw new PaymongoGatewayError("PayMongo rate limited the request", "PAYMONGO_RATE_LIMITED", response.status)
    throw new PaymongoGatewayError("PayMongo could not process the request", "PAYMONGO_PROVIDER_ERROR", response.status)
  }
  if (body === null)
    throw new PaymongoGatewayError(
      "PayMongo returned an invalid response",
      "PAYMONGO_RESPONSE_INVALID",
      response.status,
    )
  return body
}

export function paymongoLivemode() {
  const key = secretKey()
  if (key.startsWith("sk_live_")) return true
  if (key.startsWith("sk_test_")) return false
  throw new PaymongoGatewayError(
    "PAYMONGO_SECRET_KEY must be a PayMongo test or live secret key",
    "PAYMONGO_CONFIGURATION_ERROR",
  )
}

function validateReturnUrl(value: string, field: "successUrl" | "cancelUrl") {
  const url = new URL(value)
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1"
  if (url.protocol !== "https:" && !(isLocal && url.protocol === "http:"))
    throw new PaymongoGatewayError(`${field} must use HTTPS`, "PAYMONGO_INVALID_REQUEST")
  return url.toString()
}

function parsePaymentMethodCapabilities(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string")
  if (!value || typeof value !== "object" || !("data" in value)) return []
  const data = value.data
  if (Array.isArray(data)) return data.filter((item): item is string => typeof item === "string")
  if (!data || typeof data !== "object" || !("attributes" in data)) return []
  const attributes = data.attributes
  if (!attributes || typeof attributes !== "object" || !("payment_method_types" in attributes)) return []
  const methods = attributes.payment_method_types
  return Array.isArray(methods) ? methods.filter((item): item is string => typeof item === "string") : []
}

export async function listPaymongoCheckoutPaymentMethods(): Promise<PaymongoCheckoutPaymentMethod[]> {
  const response = await request<unknown>("/v1/merchants/capabilities/payment_methods")
  const enabled = new Set(parsePaymentMethodCapabilities(response))
  return checkoutPaymentMethods.filter((method) => enabled.has(method))
}

export async function createPaymongoCheckoutSession(
  rawInput: CreatePaymongoCheckoutSessionInput,
): Promise<PaymongoCheckoutSession> {
  const input = checkoutInputSchema.parse(rawInput)
  const successUrl = validateReturnUrl(input.successUrl, "successUrl")
  const cancelUrl = validateReturnUrl(input.cancelUrl, "cancelUrl")
  const paymentMethodTypes = await listPaymongoCheckoutPaymentMethods()
  if (paymentMethodTypes.length === 0)
    throw new PaymongoGatewayError(
      "No supported PayMongo checkout payment method is active",
      "PAYMONGO_NO_PAYMENT_METHODS",
    )

  const response = await request<unknown>("/v2/checkout_sessions", {
    method: "POST",
    idempotencyKey: input.idempotencyKey,
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: [
            {
              name: input.target === "user" ? "ProjectFlow User Pro — 30 days" : "ProjectFlow Workspace Pro — 30 days",
              amount: input.amount,
              currency: input.currency,
              quantity: 1,
            },
          ],
          payment_method_types: paymentMethodTypes,
          success_url: successUrl,
          cancel_url: cancelUrl,
          reference_number: input.referenceNumber,
        },
      },
    }),
  })

  const parsed = checkoutSessionResponseSchema.safeParse(response)
  if (!parsed.success)
    throw new PaymongoGatewayError("PayMongo returned an invalid Checkout Session", "PAYMONGO_RESPONSE_INVALID")
  if (parsed.data.data.attributes.livemode !== paymongoLivemode())
    throw new PaymongoGatewayError("PayMongo returned a Checkout Session in the wrong mode", "PAYMONGO_MODE_MISMATCH")

  const checkoutUrl = new URL(parsed.data.data.attributes.checkout_url)
  if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.paymongo.com")
    throw new PaymongoGatewayError("PayMongo returned an unsafe checkout URL", "PAYMONGO_RESPONSE_INVALID")

  return {
    id: parsed.data.data.id,
    checkoutUrl: checkoutUrl.toString(),
    livemode: parsed.data.data.attributes.livemode,
    createdAt: parsed.data.data.attributes.created_at,
    paymentMethodTypes,
  }
}

export async function createPaymongoPlan(input: {
  name: string
  description: string
  amount: number
  interval: "monthly" | "yearly"
  idempotencyKey: string
}) {
  return request<{ data: { id: string; attributes: { livemode: boolean } } }>("/v1/subscriptions/plans", {
    method: "POST",
    idempotencyKey: input.idempotencyKey,
    body: JSON.stringify({
      data: {
        attributes: {
          name: input.name,
          description: input.description,
          amount: input.amount,
          currency: "PHP",
          interval: input.interval === "monthly" ? "month" : "year",
          interval_count: 1,
        },
      },
    }),
  })
}

export async function retrievePaymongoPlan(id: string) {
  return request<{ data: { id: string; attributes: { livemode: boolean; amount: number; name: string } } }>(
    `/v1/subscriptions/plans/${id}`,
  )
}

export async function createPaymongoCustomer(input: { name: string; email: string; idempotencyKey: string }) {
  const [firstName, ...rest] = input.name.trim().split(/\s+/)
  return request<{ data: { id: string } }>("/v1/customers", {
    method: "POST",
    idempotencyKey: input.idempotencyKey,
    body: JSON.stringify({
      data: { attributes: { first_name: firstName, last_name: rest.join(" ") || firstName, email: input.email } },
    }),
  })
}

export async function createPaymongoSubscription(input: {
  customerId: string
  planId: string
  idempotencyKey: string
}) {
  return request<{ data: { id: string; attributes: Record<string, unknown> } }>("/v1/subscriptions", {
    method: "POST",
    idempotencyKey: input.idempotencyKey,
    body: JSON.stringify({
      data: { attributes: { customer_id: input.customerId, plan_id: input.planId } },
    }),
  })
}

export async function retrievePaymongoSubscription(id: string) {
  return request<{ data: { id: string; attributes: Record<string, unknown> } }>(`/v1/subscriptions/${id}`)
}

export async function retrievePaymongoPaymentIntent(id: string) {
  return request<{
    data: {
      id: string
      attributes: { client_key: string; status: string; next_action?: { redirect?: { url?: string } } }
    }
  }>(`/v1/payment_intents/${id}`)
}

export async function cancelPaymongoSubscription(id: string, reason: string) {
  void reason
  return request<{ data: { id: string; attributes: Record<string, unknown> } }>(`/v1/subscriptions/${id}`, {
    method: "DELETE",
  })
}

export function verifyPaymongoSignature(rawBody: string, header: string | null) {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET
  if (!secret || !header) return false
  const parts = Object.fromEntries(header.split(",").map((part) => part.trim().split("=", 2)))
  const timestamp = parts.t
  let supplied: string | undefined
  try {
    supplied = paymongoLivemode() ? parts.li : parts.te
  } catch {
    return false
  }
  const timestampNumber = Number(timestamp)
  if (
    !timestamp ||
    !supplied ||
    !Number.isFinite(timestampNumber) ||
    Math.abs(Date.now() / 1000 - timestampNumber) > 300
  )
    return false
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex")
  if (expected.length !== supplied.length) return false
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))
}
