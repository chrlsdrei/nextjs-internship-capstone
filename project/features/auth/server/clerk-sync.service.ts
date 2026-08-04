import "server-only"

import { userSyncSchema } from "@/features/auth/auth.schema"
import { deleteUserByClerkId, upsertUser } from "@/features/auth/server/user.repository"

type ClerkUserPayload = {
  id: string
  email_addresses: Array<{ id: string; email_address: string }>
  primary_email_address_id: string | null
  first_name: string | null
  last_name: string | null
  username: string | null
}

export class ClerkSyncPayloadError extends Error {
  readonly status = 422

  constructor(
    message: string,
    public readonly issues: unknown,
  ) {
    super(message)
    this.name = "ClerkSyncPayloadError"
  }
}

function primaryEmail(data: ClerkUserPayload) {
  return (
    data.email_addresses.find((email) => email.id === data.primary_email_address_id)?.email_address ??
    data.email_addresses[0]?.email_address
  )
}

function displayName(data: ClerkUserPayload, email: string) {
  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ").trim()
  return fullName || data.username || email.split("@")[0] || "ProjectFlow user"
}

export async function synchronizeClerkUser(data: ClerkUserPayload) {
  const email = primaryEmail(data)
  const parsedUser = userSyncSchema.safeParse({
    clerkId: data.id,
    email,
    name: email ? displayName(data, email) : "",
  })

  if (!parsedUser.success) {
    throw new ClerkSyncPayloadError("Clerk user payload is missing required profile data", parsedUser.error.issues)
  }

  return upsertUser(parsedUser.data)
}

export async function removeSynchronizedClerkUser(clerkId: string) {
  return deleteUserByClerkId(clerkId)
}
