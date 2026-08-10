import "server-only"

import { and, eq, inArray, isNull, notInArray, sql } from "drizzle-orm"

import type { UserSyncInput } from "@/features/auth/auth.schema"
import { db } from "@/server/db/client"
import { users, workspaceMembers, workspaces } from "@/server/db/schema"

export async function upsertUser(input: UserSyncInput) {
  const normalizedEmail = input.email.trim().toLowerCase()
  const [user] = await db
    .insert(users)
    .values({ ...input, normalizedEmail })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: {
        email: sql`case when ${users.accountStatus} = 'deleted' then ${users.email} else ${input.email} end`,
        name: sql`case when ${users.accountStatus} = 'deleted' then ${users.name} else ${input.name} end`,
        normalizedEmail: sql`case when ${users.accountStatus} = 'deleted' then ${users.normalizedEmail} else ${normalizedEmail} end`,
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

export async function softDeleteUserByClerkId(clerkId: string) {
  const user = await findUserByClerkId(clerkId)
  if (!user) return null

  const now = new Date()
  const tombstoneEmail = `deleted+${user.id}@projectflow.invalid`
  const ownerMembershipIds = db
    .select({ id: workspaces.ownerWorkspaceMemberId })
    .from(workspaces)
    .innerJoin(workspaceMembers, eq(workspaceMembers.id, workspaces.ownerWorkspaceMemberId))
    .where(and(eq(workspaceMembers.userId, user.id), isNull(workspaceMembers.removedAt)))

  await db.batch([
    db
      .update(users)
      .set({
        email: tombstoneEmail,
        normalizedEmail: tombstoneEmail,
        name: "Deleted user",
        accountStatus: "deleted",
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, user.id)),
    db
      .update(workspaces)
      .set({ status: "suspended", updatedAt: now })
      .where(inArray(workspaces.ownerWorkspaceMemberId, ownerMembershipIds)),
    db
      .update(workspaceMembers)
      .set({ removedAt: now, updatedAt: now })
      .where(
        and(
          eq(workspaceMembers.userId, user.id),
          isNull(workspaceMembers.removedAt),
          notInArray(workspaceMembers.id, ownerMembershipIds),
        ),
      ),
  ])

  return { id: user.id }
}
