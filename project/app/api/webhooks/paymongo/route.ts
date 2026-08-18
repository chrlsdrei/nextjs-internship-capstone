import { NextResponse } from "next/server"

import { CheckoutWebhookError, processCheckoutWebhook } from "@/features/billing/server/checkout-webhook.service"
import { verifyPaymongoSignature } from "@/features/billing/server/paymongo.gateway"

export async function POST(request: Request) {
  const rawBody = await request.text()
  if (!verifyPaymongoSignature(rawBody, request.headers.get("paymongo-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
  }

  try {
    const result = await processCheckoutWebhook(payload, rawBody)
    return NextResponse.json({ received: true, ...result })
  } catch (error) {
    if (error instanceof CheckoutWebhookError)
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
