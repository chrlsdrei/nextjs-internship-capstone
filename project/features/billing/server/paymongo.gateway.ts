import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"

const PAYMONGO_API = "https://api.paymongo.com/v1"

function secretKey() {
  const value = process.env.PAYMONGO_SECRET_KEY
  if (!value) throw new Error("PAYMONGO_SECRET_KEY is not configured")
  return value
}

function authHeader() {
  return `Basic ${Buffer.from(`${secretKey()}:`).toString("base64")}`
}

async function request<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}) {
  const response = await fetch(`${PAYMONGO_API}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(init.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {}),
      ...init.headers,
    },
    cache: "no-store",
  })
  const body = (await response.json().catch(() => null)) as T | { errors?: Array<{ detail?: string }> } | null
  if (!response.ok) {
    const message = body && typeof body === "object" && "errors" in body ? body.errors?.[0]?.detail : undefined
    throw new Error(message ?? `PayMongo request failed with status ${response.status}`)
  }
  return body as T
}

export function paymongoLivemode() {
  const key = secretKey()
  if (key.startsWith("sk_live_")) return true
  if (key.startsWith("sk_test_")) return false
  throw new Error("PAYMONGO_SECRET_KEY must be a PayMongo test or live secret key")
}

export async function createPaymongoPlan(input: {
  name: string
  description: string
  amount: number
  interval: "monthly" | "yearly"
  idempotencyKey: string
}) {
  return request<{ data: { id: string; attributes: { livemode: boolean } } }>("/subscriptions/plans", {
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
    `/subscriptions/plans/${id}`,
  )
}

export async function createPaymongoCustomer(input: { name: string; email: string; idempotencyKey: string }) {
  const [firstName, ...rest] = input.name.trim().split(/\s+/)
  return request<{ data: { id: string } }>("/customers", {
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
  return request<{ data: { id: string; attributes: Record<string, unknown> } }>("/subscriptions", {
    method: "POST",
    idempotencyKey: input.idempotencyKey,
    body: JSON.stringify({
      data: { attributes: { customer_id: input.customerId, plan_id: input.planId } },
    }),
  })
}

export async function retrievePaymongoSubscription(id: string) {
  return request<{ data: { id: string; attributes: Record<string, unknown> } }>(`/subscriptions/${id}`)
}

export async function retrievePaymongoPaymentIntent(id: string) {
  return request<{
    data: {
      id: string
      attributes: { client_key: string; status: string; next_action?: { redirect?: { url?: string } } }
    }
  }>(`/payment_intents/${id}`)
}

export async function cancelPaymongoSubscription(id: string, reason: string) {
  void reason
  return request<{ data: { id: string; attributes: Record<string, unknown> } }>(`/subscriptions/${id}`, {
    method: "DELETE",
  })
}

export function verifyPaymongoSignature(rawBody: string, header: string | null) {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET
  if (!secret || !header) return false
  const parts = Object.fromEntries(header.split(",").map((part) => part.trim().split("=", 2)))
  const timestamp = parts.t
  const supplied = paymongoLivemode() ? parts.li : parts.te
  if (!timestamp || !supplied || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex")
  if (expected.length !== supplied.length) return false
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))
}
