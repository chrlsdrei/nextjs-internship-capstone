import { randomUUID } from "node:crypto"

import { neon } from "@neondatabase/serverless"
import { eq, inArray } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { afterEach, beforeAll, describe, expect, it } from "vitest"

import * as schema from "../../server/db/schema"
import { calendarEvents, users, workspaceMembers, workspaceSettings, workspaces } from "../../server/db/schema"

const client = neon(process.env.TEST_DATABASE_URL as string)
const database = drizzle({ client, schema })
const createdWorkspaceIds = new Set<string>()
const createdUserIds = new Set<string>()

async function createWorkspace(label: string) {
  const id = randomUUID()
  const membershipId = randomUUID()
  const email = `${label}-${randomUUID()}@projectflow.test`
  const [user] = await database
    .insert(users)
    .values({ clerkId: `user_${randomUUID()}`, email, normalizedEmail: email, name: label })
    .returning()
  createdUserIds.add(user.id)
  await database.batch([
    database.insert(workspaces).values({ id, name: label, ownerWorkspaceMemberId: membershipId }),
    database.insert(workspaceMembers).values({ id: membershipId, workspaceId: id, userId: user.id, role: "admin" }),
    database.insert(workspaceSettings).values({ workspaceId: id }),
  ])
  createdWorkspaceIds.add(id)
  return { id, membershipId }
}

beforeAll(async () => {
  const [result] = await client`select to_regclass('public.calendar_events') as calendar_events`
  if (!result.calendar_events) throw new Error("Calendar schema is missing. Run pnpm db:test:migrate first.")
})

afterEach(async () => {
  if (createdWorkspaceIds.size > 0)
    await database.delete(workspaces).where(inArray(workspaces.id, [...createdWorkspaceIds]))
  if (createdUserIds.size > 0) await database.delete(users).where(inArray(users.id, [...createdUserIds]))
  createdWorkspaceIds.clear()
  createdUserIds.clear()
})

describe("calendar event persistence", () => {
  it("stores an event for an active workspace member", async () => {
    const workspace = await createWorkspace("calendar-owner")
    const startsAt = new Date("2026-08-18T09:00:00.000Z")
    const [created] = await database
      .insert(calendarEvents)
      .values({
        workspaceId: workspace.id,
        createdByWorkspaceMemberId: workspace.membershipId,
        title: "Planning",
        startsAt,
        endsAt: new Date("2026-08-18T10:00:00.000Z"),
      })
      .returning()
    const [stored] = await database.select().from(calendarEvents).where(eq(calendarEvents.id, created.id))
    expect(stored.title).toBe("Planning")
    expect(stored.startsAt.toISOString()).toBe(startsAt.toISOString())
  })

  it("rejects a creator membership from another workspace", async () => {
    const first = await createWorkspace("calendar-first")
    const second = await createWorkspace("calendar-second")
    await expect(
      database.insert(calendarEvents).values({
        workspaceId: first.id,
        createdByWorkspaceMemberId: second.membershipId,
        title: "Invalid",
        startsAt: new Date("2026-08-18T09:00:00.000Z"),
        endsAt: new Date("2026-08-18T10:00:00.000Z"),
      }),
    ).rejects.toThrow()
  })

  it("rejects an event whose end is not after its start", async () => {
    const workspace = await createWorkspace("calendar-order")
    const startsAt = new Date("2026-08-18T09:00:00.000Z")
    await expect(
      database.insert(calendarEvents).values({
        workspaceId: workspace.id,
        createdByWorkspaceMemberId: workspace.membershipId,
        title: "Invalid",
        startsAt,
        endsAt: startsAt,
      }),
    ).rejects.toThrow()
  })
})
