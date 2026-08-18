import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verifyPaymongoSignature: vi.fn(),
  processCheckoutWebhook: vi.fn(),
}))

vi.mock("@/features/billing/server/paymongo.gateway", () => ({
  verifyPaymongoSignature: mocks.verifyPaymongoSignature,
}))
vi.mock("@/features/billing/server/checkout-webhook.service", () => ({
  CheckoutWebhookError: class CheckoutWebhookError extends Error {},
  processCheckoutWebhook: mocks.processCheckoutWebhook,
}))

import { POST } from "@/app/api/webhooks/paymongo/route"

function request(body: string) {
  return new Request("https://projectflow.example/api/webhooks/paymongo", {
    method: "POST",
    headers: { "Paymongo-Signature": "signed" },
    body,
  })
}

describe("PayMongo webhook route", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects an invalid signature before parsing or database processing", async () => {
    mocks.verifyPaymongoSignature.mockReturnValue(false)
    const response = await POST(request("not-json"))

    expect(response.status).toBe(400)
    expect(mocks.verifyPaymongoSignature).toHaveBeenCalledWith("not-json", "signed")
    expect(mocks.processCheckoutWebhook).not.toHaveBeenCalled()
  })

  it("passes the verified raw body and parsed payload to checkout processing", async () => {
    mocks.verifyPaymongoSignature.mockReturnValue(true)
    mocks.processCheckoutWebhook.mockResolvedValue({ ignored: false, duplicate: false })
    const rawBody = '{"data":{"id":"evt_test"}}'
    const response = await POST(request(rawBody))

    expect(response.status).toBe(200)
    expect(mocks.processCheckoutWebhook).toHaveBeenCalledWith(JSON.parse(rawBody), rawBody)
  })
})
