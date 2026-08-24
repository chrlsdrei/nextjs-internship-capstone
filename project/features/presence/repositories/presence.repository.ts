import "server-only"

import { inArray } from "drizzle-orm"

import { db } from "@/server/db/client"
import { userPresence } from "@/server/db/schema"

export async function touchUserPresence(userId: string) {
  const lastSeenAt = new Date()
  await db.insert(userPresence).values({ userId, lastSeenAt }).onConflictDoUpdate({
    target: userPresence.userId,
    set: { lastSeenAt },
  })

  return lastSeenAt
}

export async function listPresenceByUserIds(userIds: string[]) {
  if (userIds.length === 0) return []

  return db
    .select({ userId: userPresence.userId, lastSeenAt: userPresence.lastSeenAt })
    .from(userPresence)
    .where(inArray(userPresence.userId, userIds))
}
