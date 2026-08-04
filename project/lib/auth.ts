import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"

import { getUserByClerkId } from "./db/queries/users"

export async function requireUserId() {
  const { userId } = await auth.protect()
  return userId
}

export async function getSessionUser() {
  const { userId } = await auth()
  if (!userId) {
    return null
  }

  return currentUser()
}

export async function getCurrentDatabaseUser() {
  const clerkId = await requireUserId()
  const user = await getUserByClerkId(clerkId)
  if (!user) {
    throw new Error("Your account is not synchronized yet. Please try again shortly.")
  }

  return user
}
