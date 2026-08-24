import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createPaymongoCheckoutSession, PaymongoGatewayError } from "@/features/billing/gateways/paymongo.gateway"

const input = {
  target: "user" as const,
  amount: 29_900,
  currency: "PHP" as const,
  referenceNumber: "PROJECTFLOW-CHECKOUT-123",
  successUrl: "https://projectflow.example/subscription?checkout=success",
  cancelUrl: "https://projectflow.example/subscription?checkout=cancelled",
  idempotencyKey: "checkout-idempotency-123",
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("PayMongo Checkout Session gateway", () => {
  beforeEach(() => {
    process.env.PAYMONGO_SECRET_KEY = "sk_test_gateway"
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.PAYMONGO_SECRET_KEY
  })

  it("uses active account methods and creates a v2 hosted Checkout Session", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(["card", "paymaya", "qrph", "unsupported_method"]))
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            id: "cs_test_123",
            type: "checkout_session",
            attributes: {
              checkout_url: "https://checkout.paymongo.com/cs_test_123",
              livemode: false,
              created_at: 1_787_000_000,
            },
          },
        }),
      )
    vi.stubGlobal("fetch", fetchMock)

    const session = await createPaymongoCheckoutSession(input)

    expect(session).toEqual({
      id: "cs_test_123",
      checkoutUrl: "https://checkout.paymongo.com/cs_test_123",
      livemode: false,
      createdAt: 1_787_000_000,
      paymentMethodTypes: ["card", "paymaya", "qrph"],
    })
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.paymongo.com/v1/merchants/capabilities/payment_methods",
      expect.objectContaining({ cache: "no-store" }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.paymongo.com/v2/checkout_sessions",
      expect.objectContaining({ method: "POST", cache: "no-store" }),
    )

    const request = fetchMock.mock.calls[1]?.[1] as RequestInit
    const headers = request.headers as Headers
    const body = JSON.parse(String(request.body))
    expect(headers.get("Authorization")).toBe(`Basic ${Buffer.from("sk_test_gateway:").toString("base64")}`)
    expect(headers.get("Idempotency-Key")).toBe(input.idempotencyKey)
    expect(body.data.attributes).toEqual({
      line_items: [
        {
          name: "QuestBoard User Pro — 30 days",
          amount: 29_900,
          currency: "PHP",
          quantity: 1,
        },
      ],
      payment_method_types: ["card", "paymaya", "qrph"],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      reference_number: input.referenceNumber,
    })
  })

  it("rejects checkout when no supported account method is active", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(jsonResponse(["unsupported_method"])))

    await expect(createPaymongoCheckoutSession(input)).rejects.toMatchObject({
      code: "PAYMONGO_NO_PAYMENT_METHODS",
    })
  })

  it("rejects a provider response from the wrong mode", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(["qrph"]))
        .mockResolvedValueOnce(
          jsonResponse({
            data: {
              id: "cs_live_123",
              type: "checkout_session",
              attributes: {
                checkout_url: "https://checkout.paymongo.com/cs_live_123",
                livemode: true,
                created_at: 1_787_000_000,
              },
            },
          }),
        ),
    )

    await expect(createPaymongoCheckoutSession(input)).rejects.toMatchObject({ code: "PAYMONGO_MODE_MISMATCH" })
  })

  it("normalizes provider errors without exposing the raw provider detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(["qrph"]))
        .mockResolvedValueOnce(jsonResponse({ errors: [{ detail: "sensitive provider detail" }] }, 400)),
    )

    const error = await createPaymongoCheckoutSession(input).catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(PaymongoGatewayError)
    expect(error).toMatchObject({ code: "PAYMONGO_INVALID_REQUEST", providerStatus: 400 })
    expect((error as Error).message).not.toContain("sensitive provider detail")
  })

  it("rejects non-HTTPS production return URLs before making a provider request", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    await expect(
      createPaymongoCheckoutSession({ ...input, successUrl: "http://projectflow.example/subscription" }),
    ).rejects.toMatchObject({ code: "PAYMONGO_INVALID_REQUEST" })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
