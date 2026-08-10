import { verifyWebhook } from "@clerk/nextjs/webhooks"
import type { NextRequest } from "next/server"

import {
  ClerkSyncPayloadError,
  removeSynchronizedClerkUser,
  synchronizeClerkUser,
} from "@/features/auth/server/clerk-sync.service"

export async function POST(request: NextRequest) {
  let event: Awaited<ReturnType<typeof verifyWebhook>>

  try {
    event = await verifyWebhook(request)
  } catch {
    return new Response("Invalid webhook signature", { status: 400 })
  }

  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      await synchronizeClerkUser(event.data)
    }

    if (event.type === "user.deleted" && event.data.id) {
      await removeSynchronizedClerkUser(event.data.id)
    }

    return Response.json({ received: true })
  } catch (error) {
    if (error instanceof ClerkSyncPayloadError) {
      return Response.json({ error: error.message, issues: error.issues }, { status: error.status })
    }

    console.error("Failed to synchronize Clerk user", error)
    return new Response("Webhook processing failed", { status: 500 })
  }
}
