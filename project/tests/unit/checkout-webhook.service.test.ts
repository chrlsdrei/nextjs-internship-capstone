import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  paymongoLivemode: vi.fn(),
  findCheckoutPurchaseForWebhook: vi.fn(),
  fulfillCheckoutPurchase: vi.fn(),
  recordCheckoutWebhookFailure: vi.fn(),
}))

vi.mock("@/features/billing/gateways/paymongo.gateway", () => ({
  paymongoLivemode: mocks.paymongoLivemode,
}))
vi.mock("@/features/billing/repositories/checkout-webhook.repository", () => ({
  findCheckoutPurchaseForWebhook: mocks.findCheckoutPurchaseForWebhook,
  fulfillCheckoutPurchase: mocks.fulfillCheckoutPurchase,
  recordCheckoutWebhookFailure: mocks.recordCheckoutWebhookFailure,
}))

import { processCheckoutWebhook } from "@/features/billing/services/checkout-webhook.service"

const purchase = {
  id: "807621bd-c8e0-4b2f-b73d-89603e851f35",
  target: "user" as const,
  userId: "9f9b1401-d5cc-4bc2-9d39-99948f85b714",
  workspaceId: null,
  payerUserId: "9f9b1401-d5cc-4bc2-9d39-99948f85b714",
  referenceNumber: "PF-TEST-123",
  paymongoCheckoutSessionId: "cs_test_123",
  amount: 29_900,
  currency: "PHP",
  status: "pending",
  accessEndsAt: null,
}
const plan = { target: "user", livemode: false }

function payload(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      id: "evt_test_123",
      type: "event",
      attributes: {
        type: "checkout_session.payment.paid",
        livemode: false,
        created_at: 1_787_000_000,
        data: {
          id: "cs_test_123",
          type: "checkout_session",
          attributes: {
            reference_number: "PF-TEST-123",
            payments: [
              {
                id: "pay_test_123",
                type: "payment",
                attributes: { amount: 29_900, currency: "PHP", status: "paid", paid_at: 1_787_000_000 },
              },
            ],
          },
          ...overrides,
        },
      },
    },
  }
}

describe("checkout webhook service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.paymongoLivemode.mockReturnValue(false)
    mocks.recordCheckoutWebhookFailure.mockResolvedValue(undefined)
    mocks.findCheckoutPurchaseForWebhook.mockResolvedValue({ purchase, plan })
    mocks.fulfillCheckoutPurchase.mockResolvedValue({
      claimed: true,
      fulfilled: true,
      purchase_id: purchase.id,
      access_ends_at: "2026-09-18T00:00:00.000Z",
    })
  })

  it("validates and fulfills the matching purchase", async () => {
    await expect(processCheckoutWebhook(payload(), JSON.stringify(payload()))).resolves.toMatchObject({
      duplicate: false,
      purchaseId: purchase.id,
      accessEndsAt: "2026-09-18T00:00:00.000Z",
    })
    expect(mocks.fulfillCheckoutPurchase).toHaveBeenCalledWith(
      expect.objectContaining({
        purchaseId: purchase.id,
        userId: purchase.userId,
        workspaceId: null,
        checkoutSessionId: "cs_test_123",
      }),
    )
  })

  it("reports an already-processed delivery without another entitlement grant", async () => {
    mocks.fulfillCheckoutPurchase.mockResolvedValue({
      claimed: false,
      fulfilled: false,
      purchase_id: null,
      access_ends_at: null,
    })
    await expect(processCheckoutWebhook(payload(), JSON.stringify(payload()))).resolves.toMatchObject({
      duplicate: true,
    })
  })

  it("fulfills a verified payment even after the browser marked its checkout cancelled", async () => {
    mocks.findCheckoutPurchaseForWebhook.mockResolvedValue({ purchase: { ...purchase, status: "cancelled" }, plan })

    await expect(processCheckoutWebhook(payload(), JSON.stringify(payload()))).resolves.toMatchObject({
      duplicate: false,
      purchaseId: purchase.id,
    })
    expect(mocks.fulfillCheckoutPurchase).toHaveBeenCalledOnce()
  })

  it("acknowledges a paid purchase without extending access twice", async () => {
    mocks.findCheckoutPurchaseForWebhook.mockResolvedValue({ purchase: { ...purchase, status: "paid" }, plan })

    await expect(processCheckoutWebhook(payload(), JSON.stringify(payload()))).resolves.toEqual({
      ignored: false,
      duplicate: true,
      purchaseId: purchase.id,
    })
    expect(mocks.fulfillCheckoutPurchase).not.toHaveBeenCalled()
  })

  it("rejects amount mismatches before fulfillment and records the failure", async () => {
    const mismatched = payload()
    mismatched.data.attributes.data.attributes.payments[0].attributes.amount = 39_900

    await expect(processCheckoutWebhook(mismatched, JSON.stringify(mismatched))).rejects.toMatchObject({
      code: "CHECKOUT_PAYMENT_MISMATCH",
    })
    expect(mocks.fulfillCheckoutPurchase).not.toHaveBeenCalled()
    expect(mocks.recordCheckoutWebhookFailure).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: "CHECKOUT_PAYMENT_MISMATCH" }),
    )
  })

  it("rejects test events in a live environment", async () => {
    mocks.paymongoLivemode.mockReturnValue(true)
    await expect(processCheckoutWebhook(payload(), JSON.stringify(payload()))).rejects.toMatchObject({
      code: "CHECKOUT_MODE_MISMATCH",
    })
    expect(mocks.findCheckoutPurchaseForWebhook).not.toHaveBeenCalled()
  })
})
