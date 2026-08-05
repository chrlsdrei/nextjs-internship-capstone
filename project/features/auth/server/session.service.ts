import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"

import { assertAccountCanAccessApplication } from "@/features/auth/account.policy"
import { findUserByClerkId } from "@/features/auth/server/user.repository"

export async function requireClerkUserId() {
  const { userId } = await auth.protect()
  return userId
}

export async function getSessionUser() {
  const { userId } = await auth()
  if (!userId) return null
  return currentUser()
}

export async function getCurrentDatabaseUser() {
  const clerkId = await requireClerkUserId()
  const user = await findUserByClerkId(clerkId)

  if (!user) {
    throw new Error("Your account is not synchronized yet. Please try again shortly.")
  }

  assertAccountCanAccessApplication(user.accountStatus)

  return user
}
