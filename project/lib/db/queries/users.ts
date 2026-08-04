import "server-only"

import { eq } from "drizzle-orm"

import type { UserSyncInput } from "@/lib/validations"

import { db } from "../index"
import { users } from "../schema"

export async function upsertUserFromClerk(input: UserSyncInput) {
  const [user] = await db
    .insert(users)
    .values(input)
    .onConflictDoUpdate({
      target: users.clerkId,
      set: {
        email: input.email,
        name: input.name,
        updatedAt: new Date(),
      },
    })
    .returning()

  return user
}

export async function getUserByClerkId(clerkId: string) {
  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
  return user ?? null
}

export async function deleteUserByClerkId(clerkId: string) {
  const [deletedUser] = await db.delete(users).where(eq(users.clerkId, clerkId)).returning({ id: users.id })
  return deletedUser ?? null
}
