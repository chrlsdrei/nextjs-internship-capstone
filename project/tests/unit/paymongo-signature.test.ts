import { createHmac } from "node:crypto"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { verifyPaymongoSignature } from "@/features/billing/server/paymongo.gateway"

describe("PayMongo webhook signatures", () => {
  beforeEach(() => {
    process.env.PAYMONGO_SECRET_KEY = "sk_test_signature"
    process.env.PAYMONGO_WEBHOOK_SECRET = "whsk_test_signature"
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-19T00:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
    delete process.env.PAYMONGO_SECRET_KEY
    delete process.env.PAYMONGO_WEBHOOK_SECRET
  })

  it("verifies the test signature over timestamp and untouched body", () => {
    const rawBody = '{"data":{"id":"evt_test"}}'
    const timestamp = String(Math.floor(Date.now() / 1_000))
    const signature = createHmac("sha256", "whsk_test_signature").update(`${timestamp}.${rawBody}`).digest("hex")

    expect(verifyPaymongoSignature(rawBody, `t=${timestamp},te=${signature},li=`)).toBe(true)
    expect(verifyPaymongoSignature(`${rawBody}\n`, `t=${timestamp},te=${signature},li=`)).toBe(false)
  })

  it("rejects stale, malformed, and wrong-mode signatures", () => {
    const oldTimestamp = String(Math.floor(Date.now() / 1_000) - 301)
    const signature = createHmac("sha256", "whsk_test_signature").update(`${oldTimestamp}.{}`).digest("hex")
    expect(verifyPaymongoSignature("{}", `t=${oldTimestamp},te=${signature},li=`)).toBe(false)
    expect(verifyPaymongoSignature("{}", "invalid")).toBe(false)
    expect(verifyPaymongoSignature("{}", null)).toBe(false)
  })
})
