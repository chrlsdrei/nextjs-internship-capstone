import { verifyWebhook } from "@clerk/nextjs/webhooks"
import type { NextRequest } from "next/server"

import { deleteUserByClerkId, upsertUserFromClerk } from "@/lib/db/queries/users"
import { userSyncSchema } from "@/lib/validations"

function getPrimaryEmail(data: {
  email_addresses: Array<{ id: string; email_address: string }>
  primary_email_address_id: string | null
}) {
  return (
    data.email_addresses.find((email) => email.id === data.primary_email_address_id)?.email_address ??
    data.email_addresses[0]?.email_address
  )
}

function getDisplayName(data: {
  first_name: string | null
  last_name: string | null
  username: string | null
  email: string
}) {
  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ").trim()
  return fullName || data.username || data.email.split("@")[0] || "ProjectFlow user"
}

export async function POST(request: NextRequest) {
  let event: Awaited<ReturnType<typeof verifyWebhook>>

  try {
    event = await verifyWebhook(request)
  } catch {
    return new Response("Invalid webhook signature", { status: 400 })
  }

  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      const email = getPrimaryEmail(event.data)
      const parsedUser = userSyncSchema.safeParse({
        clerkId: event.data.id,
        email,
        name: email
          ? getDisplayName({
              first_name: event.data.first_name,
              last_name: event.data.last_name,
              username: event.data.username,
              email,
            })
          : "",
      })

      if (!parsedUser.success) {
        return Response.json(
          { error: "Clerk user payload is missing required profile data", issues: parsedUser.error.issues },
          { status: 422 },
        )
      }

      await upsertUserFromClerk(parsedUser.data)
    }

    if (event.type === "user.deleted" && event.data.id) {
      await deleteUserByClerkId(event.data.id)
    }

    return Response.json({ received: true })
  } catch (error) {
    console.error("Failed to synchronize Clerk user", error)
    return new Response("Webhook processing failed", { status: 500 })
  }
}
