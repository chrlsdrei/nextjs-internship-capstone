import "server-only"

import { eq } from "drizzle-orm"

import type { UserSyncInput } from "@/features/auth/auth.schema"
import { db } from "@/server/db/client"
import { users } from "@/server/db/schema"

export async function upsertUser(input: UserSyncInput) {
  const normalizedEmail = input.email.trim().toLowerCase()
  const [user] = await db
    .insert(users)
    .values({ ...input, normalizedEmail })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: {
        email: input.email,
        name: input.name,
        normalizedEmail,
        updatedAt: new Date(),
      },
    })
    .returning()

  return user
}

export async function findUserByClerkId(clerkId: string) {
  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
  return user ?? null
}

export async function deleteUserByClerkId(clerkId: string) {
  const [deletedUser] = await db.delete(users).where(eq(users.clerkId, clerkId)).returning({ id: users.id })
  return deletedUser ?? null
}
