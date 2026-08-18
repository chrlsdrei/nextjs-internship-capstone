import { NextResponse } from "next/server"

import { processPaymongoWebhook } from "@/features/billing/server/billing.service"
import { verifyPaymongoSignature } from "@/features/billing/server/paymongo.gateway"

export async function POST(request: Request) {
  const rawBody = await request.text()
  if (!verifyPaymongoSignature(rawBody, request.headers.get("paymongo-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }
  try {
    const event = JSON.parse(rawBody) as Parameters<typeof processPaymongoWebhook>[0]
    const result = await processPaymongoWebhook(event, rawBody)
    return NextResponse.json({ received: true, ...result })
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
