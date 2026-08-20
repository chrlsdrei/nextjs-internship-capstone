import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  startCheckout: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock("@/features/billing/services/checkout.service", () => ({ startCheckout: mocks.startCheckout }))

import { startCheckoutAction } from "@/features/billing/actions/start-checkout"

describe("checkout actions", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns only the hosted checkout redirect contract", async () => {
    mocks.startCheckout.mockResolvedValue({
      purchaseId: "8e10a124-2bd9-4bfd-b0ef-27964b9eff11",
      checkoutUrl: "https://checkout.paymongo.com/cs_test_123",
    })

    await expect(startCheckoutAction({ command: "value" })).resolves.toEqual({
      status: "success",
      data: {
        purchaseId: "8e10a124-2bd9-4bfd-b0ef-27964b9eff11",
        checkoutUrl: "https://checkout.paymongo.com/cs_test_123",
      },
      message: "Continue to PayMongo to complete your purchase.",
    })
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/subscription")
  })

  it("normalizes checkout failures without exposing provider payloads", async () => {
    mocks.startCheckout.mockRejectedValue(new Error("Unable to start PayMongo checkout"))

    await expect(startCheckoutAction({})).resolves.toMatchObject({
      status: "error",
      message: "Unable to start checkout. Please try again.",
      code: "BILLING_PROVIDER_ERROR",
    })
  })
})
