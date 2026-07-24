import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"

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
