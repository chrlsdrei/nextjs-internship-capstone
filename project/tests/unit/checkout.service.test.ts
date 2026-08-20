import { beforeEach, describe, expect, it, vi } from "vitest"

import { BillingError } from "@/features/billing/billing.error"

const mocks = vi.hoisted(() => ({
  getCurrentDatabaseUser: vi.fn(),
  findCheckoutPlan: vi.fn(),
  findActiveWorkspaceOwnerUserId: vi.fn(),
  reserveCheckoutPurchase: vi.fn(),
  attachCheckoutSession: vi.fn(),
  markCheckoutPurchaseFailed: vi.fn(),
  paymongoLivemode: vi.fn(),
  createPaymongoCheckoutSession: vi.fn(),
}))

vi.mock("@/features/auth/services/session.service", () => ({
  getCurrentDatabaseUser: mocks.getCurrentDatabaseUser,
}))
vi.mock("@/features/billing/repositories/checkout.repository", () => ({
  findCheckoutPlan: mocks.findCheckoutPlan,
  findActiveWorkspaceOwnerUserId: mocks.findActiveWorkspaceOwnerUserId,
  reserveCheckoutPurchase: mocks.reserveCheckoutPurchase,
  attachCheckoutSession: mocks.attachCheckoutSession,
  markCheckoutPurchaseFailed: mocks.markCheckoutPurchaseFailed,
}))
vi.mock("@/features/billing/gateways/paymongo.gateway", () => ({
  PaymongoGatewayError: class PaymongoGatewayError extends Error {
    constructor(
      message: string,
      public readonly code: string,
    ) {
      super(message)
    }
  },
  paymongoLivemode: mocks.paymongoLivemode,
  createPaymongoCheckoutSession: mocks.createPaymongoCheckoutSession,
}))

import { startCheckout } from "@/features/billing/services/checkout.service"

const user = { id: "c21b65cb-66e1-4b6c-9088-feb6057e9184" }
const plan = {
  id: "4f069558-a636-41de-91e7-9bf333a1b0fb",
  target: "user" as const,
  active: true,
  amount: 29_900,
  currency: "PHP",
  livemode: false,
}
const command = {
  planId: plan.id,
  idempotencyKey: "checkout-request-1234",
}

function purchase(overrides: Record<string, unknown> = {}) {
  return {
    id: "23c77a0c-049f-47ba-ad40-cae4f08d07f2",
    planId: plan.id,
    target: "user",
    userId: user.id,
    workspaceId: null,
    payerUserId: user.id,
    referenceNumber: "PF-TEST-REFERENCE",
    amount: 29_900,
    currency: "PHP",
    status: "pending",
    paymongoCheckoutSessionId: null,
    checkoutUrl: null,
    ...overrides,
  }
}

describe("checkout service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = "https://projectflow.example"
    mocks.getCurrentDatabaseUser.mockResolvedValue(user)
    mocks.findCheckoutPlan.mockResolvedValue(plan)
    mocks.paymongoLivemode.mockReturnValue(false)
    mocks.reserveCheckoutPurchase.mockResolvedValue(purchase())
    mocks.createPaymongoCheckoutSession.mockResolvedValue({
      id: "cs_test_123",
      checkoutUrl: "https://checkout.paymongo.com/cs_test_123",
      livemode: false,
      createdAt: 1_787_000_000,
      paymentMethodTypes: ["qrph"],
    })
    mocks.attachCheckoutSession.mockResolvedValue(
      purchase({
        paymongoCheckoutSessionId: "cs_test_123",
        checkoutUrl: "https://checkout.paymongo.com/cs_test_123",
      }),
    )
    mocks.markCheckoutPurchaseFailed.mockResolvedValue(null)
  })

  it("reserves a user purchase, creates the provider session, and returns safe redirect data", async () => {
    await expect(startCheckout(command)).resolves.toEqual({
      purchaseId: "23c77a0c-049f-47ba-ad40-cae4f08d07f2",
      checkoutUrl: "https://checkout.paymongo.com/cs_test_123",
    })

    expect(mocks.reserveCheckoutPurchase).toHaveBeenCalledWith(
      expect.objectContaining({
        planId: plan.id,
        target: "user",
        userId: user.id,
        workspaceId: null,
        payerUserId: user.id,
        amount: 29_900,
        currency: "PHP",
        referenceNumber: expect.stringMatching(/^PF-TEST-[A-F0-9]{32}$/),
      }),
    )
    expect(mocks.createPaymongoCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        target: "user",
        successUrl:
          "https://projectflow.example/subscription?checkout=success&purchase=23c77a0c-049f-47ba-ad40-cae4f08d07f2",
        cancelUrl:
          "https://projectflow.example/subscription?checkout=cancelled&purchase=23c77a0c-049f-47ba-ad40-cae4f08d07f2",
        idempotencyKey: expect.stringMatching(/^checkout:PF-TEST-/),
      }),
    )
  })

  it("returns an existing pending Checkout Session without another provider request", async () => {
    mocks.reserveCheckoutPurchase.mockResolvedValue(
      purchase({
        paymongoCheckoutSessionId: "cs_test_existing",
        checkoutUrl: "https://checkout.paymongo.com/cs_test_existing",
      }),
    )

    await expect(startCheckout(command)).resolves.toEqual({
      purchaseId: "23c77a0c-049f-47ba-ad40-cae4f08d07f2",
      checkoutUrl: "https://checkout.paymongo.com/cs_test_existing",
    })
    expect(mocks.createPaymongoCheckoutSession).not.toHaveBeenCalled()
  })

  it("allows only the active workspace owner to start a workspace checkout", async () => {
    const workspaceId = "818a4a89-5580-470d-ad76-883557d01065"
    mocks.findCheckoutPlan.mockResolvedValue({ ...plan, target: "workspace", amount: 39_900 })
    mocks.findActiveWorkspaceOwnerUserId.mockResolvedValue("different-user")

    await expect(startCheckout({ ...command, workspaceId })).rejects.toMatchObject({
      code: "BILLING_FORBIDDEN",
    })
    expect(mocks.reserveCheckoutPurchase).not.toHaveBeenCalled()
  })

  it("rejects a catalog product from a different PayMongo mode", async () => {
    mocks.paymongoLivemode.mockReturnValue(true)

    await expect(startCheckout(command)).rejects.toMatchObject({ code: "CHECKOUT_UNAVAILABLE", status: 409 })
    expect(mocks.reserveCheckoutPurchase).not.toHaveBeenCalled()
  })

  it("rejects reuse of an idempotency key for a different purchase", async () => {
    mocks.reserveCheckoutPurchase.mockResolvedValue(purchase({ amount: 39_900 }))

    await expect(startCheckout(command)).rejects.toMatchObject({ code: "CHECKOUT_IDEMPOTENCY_CONFLICT" })
    expect(mocks.createPaymongoCheckoutSession).not.toHaveBeenCalled()
  })

  it("marks an unbound purchase failed when PayMongo creation fails", async () => {
    mocks.createPaymongoCheckoutSession.mockRejectedValue(new Error("provider unavailable"))

    const error = await startCheckout(command).catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(BillingError)
    expect(error).toMatchObject({ code: "CHECKOUT_UNAVAILABLE", status: 502 })
    expect(mocks.markCheckoutPurchaseFailed).toHaveBeenCalledWith(
      "23c77a0c-049f-47ba-ad40-cae4f08d07f2",
      "CHECKOUT_PROVIDER_FAILURE",
    )
  })
})
