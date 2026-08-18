import { describe, expect, it } from "vitest"

import { parsePaymongoWebhook } from "@/features/billing/server/checkout-webhook.schema"

const session = {
  id: "cs_test_123",
  type: "checkout_session",
  attributes: {
    reference_number: "PF-TEST-123",
    payments: [
      {
        id: "pay_test_123",
        type: "payment",
        attributes: { amount: 29_900, currency: "php", status: "paid", paid_at: 1_787_000_000 },
      },
    ],
  },
}

describe("PayMongo checkout webhook parsing", () => {
  it("normalizes the standard PayMongo event envelope", () => {
    expect(
      parsePaymongoWebhook({
        data: {
          id: "evt_test_123",
          type: "event",
          attributes: {
            type: "checkout_session.payment.paid",
            livemode: false,
            created_at: 1_787_000_000,
            data: session,
          },
        },
      }),
    ).toMatchObject({
      type: "checkout_session.payment.paid",
      providerEventId: "evt_test_123",
      checkoutSessionId: "cs_test_123",
      referenceNumber: "PF-TEST-123",
      amount: 29_900,
      currency: "PHP",
    })
  })

  it("normalizes the hosted-checkout envelope with a deterministic event identity", () => {
    expect(
      parsePaymongoWebhook({
        event_type: "send.webhook",
        data: {
          type: "checkout_session.payment.paid",
          resource: "checkout_session",
          livemode: false,
          created_at: "2026-08-19T00:00:00Z",
          data: session,
        },
      }),
    ).toMatchObject({
      providerEventId: "checkout_session.payment.paid:cs_test_123:pay_test_123",
      checkoutSessionId: "cs_test_123",
    })
  })

  it("acknowledges unhandled signed event types without parsing their resource", () => {
    expect(
      parsePaymongoWebhook({
        data: {
          id: "evt_other",
          type: "event",
          attributes: { type: "payment.failed", livemode: false, created_at: 1_787_000_000, data: {} },
        },
      }),
    ).toEqual({ type: "ignored", eventType: "payment.failed" })
  })

  it("rejects a paid event without a valid paid checkout payment", () => {
    expect(() =>
      parsePaymongoWebhook({
        data: {
          id: "evt_invalid",
          type: "event",
          attributes: {
            type: "checkout_session.payment.paid",
            livemode: false,
            created_at: 1_787_000_000,
            data: { ...session, attributes: { ...session.attributes, payments: [] } },
          },
        },
      }),
    ).toThrow()
  })
})
