import { describe, expect, it } from "vitest"

import { startCheckoutSchema } from "@/features/billing/billing.schema"
import { checkoutPurchaseStatuses } from "@/features/billing/billing.types"

describe("checkout purchase contracts", () => {
  it("defines every persisted purchase status", () => {
    expect(checkoutPurchaseStatuses).toEqual(["pending", "paid", "cancelled", "expired", "failed"])
  })

  it("accepts a user checkout command without a workspace", () => {
    const input = startCheckoutSchema.parse({
      planId: crypto.randomUUID(),
      idempotencyKey: "  checkout-request-1234  ",
    })

    expect(input).toEqual({
      planId: expect.any(String),
      idempotencyKey: "checkout-request-1234",
    })
  })

  it("accepts a workspace checkout command", () => {
    const input = {
      planId: crypto.randomUUID(),
      workspaceId: crypto.randomUUID(),
      idempotencyKey: "checkout-request-5678",
    }

    expect(startCheckoutSchema.parse(input)).toEqual(input)
  })

  it("rejects malformed identifiers and short idempotency keys", () => {
    expect(
      startCheckoutSchema.safeParse({
        planId: "not-a-plan-id",
        workspaceId: "not-a-workspace-id",
        idempotencyKey: "too-short",
      }).success,
    ).toBe(false)
  })

  it("rejects payment credentials, secrets, and provider payloads", () => {
    expect(
      startCheckoutSchema.safeParse({
        planId: crypto.randomUUID(),
        idempotencyKey: "checkout-request-9012",
        cardNumber: "4343434343434345",
        paymongoSecretKey: "must-not-cross-this-boundary",
        providerPayload: {},
      }).success,
    ).toBe(false)
  })
})
