import { randomUUID } from "node:crypto"

import { neon } from "@neondatabase/serverless"
import { inArray, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ currentDatabaseUser: vi.fn() }))

vi.mock("@/features/auth/services/session.service", () => ({
  getCurrentDatabaseUser: mocks.currentDatabaseUser,
}))

import { listProjectActivity } from "../../features/activity/services/activity.service"
import * as schema from "../../server/db/schema"
import {
  activityLogs,
  projectMembers,
  projects,
  users,
  workspaceMembers,
  workspaceSettings,
  workspaces,
} from "../../server/db/schema"

const client = neon(process.env.TEST_DATABASE_URL as string)
const database = drizzle({ client, schema })
const workspaceIds = new Set<string>()
const userIds = new Set<string>()

async function createUser(label: string) {
  const id = randomUUID()
  const email = `${label}-${id}@projectflow.test`
  const [user] = await database
    .insert(users)
    .values({ id, clerkId: `user_${id}`, email, normalizedEmail: email, name: `User ${label}` })
    .returning()
  userIds.add(id)
  return user
}

async function fixture() {
  const owner = await createUser("activity-history-owner")
  const editor = await createUser("activity-history-editor")
  const viewer = await createUser("activity-history-viewer")
  const workspaceId = randomUUID()
  const ownerMemberId = randomUUID()
  const editorMemberId = randomUUID()
  const viewerMemberId = randomUUID()
  const projectId = randomUUID()

  await database.batch([
    database.insert(workspaces).values({
      id: workspaceId,
      name: "Activity history workspace",
      ownerWorkspaceMemberId: ownerMemberId,
    }),
    database.insert(workspaceMembers).values([
      { id: ownerMemberId, workspaceId, userId: owner.id, role: "admin" },
      { id: editorMemberId, workspaceId, userId: editor.id, role: "member" },
      { id: viewerMemberId, workspaceId, userId: viewer.id, role: "member" },
    ]),
    database.insert(workspaceSettings).values({ workspaceId }),
    database.insert(projects).values({
      id: projectId,
      workspaceId,
      title: "Activity history project",
      createdByWorkspaceMemberId: ownerMemberId,
    }),
    database.insert(projectMembers).values([
      { workspaceId, projectId, workspaceMemberId: editorMemberId, role: "editor" },
      { workspaceId, projectId, workspaceMemberId: viewerMemberId, role: "viewer" },
    ]),
  ])
  workspaceIds.add(workspaceId)
  return { owner, editor, viewer, workspaceId, ownerMemberId, projectId }
}

afterEach(async () => {
  await database.execute(sql`TRUNCATE TABLE "activity_logs"`)
  if (workspaceIds.size) await database.delete(workspaces).where(inArray(workspaces.id, [...workspaceIds]))
  if (userIds.size) await database.delete(users).where(inArray(users.id, [...userIds]))
  workspaceIds.clear()
  userIds.clear()
  vi.clearAllMocks()
})

describe("project activity history", () => {
  it("uses a stable newest-first cursor and safely returns unknown future events", async () => {
    const data = await fixture()
    const createdAt = new Date("2030-01-01T00:00:00.000Z")
    const ids = [1, 2, 3, 4, 5].map((value) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`)
    await database.insert(activityLogs).values(
      ids.map((id, index) => ({
        id,
        workspaceId: data.workspaceId,
        projectId: data.projectId,
        actorWorkspaceMemberId: data.ownerMemberId,
        action: index === 0 ? "future.project_event" : "project.updated",
        schemaVersion: index === 0 ? 2 : 1,
        metadata:
          index === 0
            ? { future: true }
            : {
                actorName: data.owner.name,
                workspaceName: "Activity history workspace",
                projectTitle: "Activity history project",
              },
        createdAt,
      })),
    )
    mocks.currentDatabaseUser.mockResolvedValue(data.owner)

    const first = await listProjectActivity({ projectId: data.projectId, limit: 2 })
    const second = await listProjectActivity({ projectId: data.projectId, limit: 2, cursor: first.nextCursor })
    const third = await listProjectActivity({ projectId: data.projectId, limit: 2, cursor: second.nextCursor })

    expect(first.items.map((item) => item.id)).toEqual([ids[4], ids[3]])
    expect(second.items.map((item) => item.id)).toEqual([ids[2], ids[1]])
    expect(third.items.map((item) => item.id)).toEqual([ids[0]])
    expect(third.items[0]).toMatchObject({ kind: "unknown", schemaVersion: 2 })
    expect(third.nextCursor).toBeNull()
  })

  it.each(["editor", "viewer"] as const)("denies activity history to a project %s", async (role) => {
    const data = await fixture()
    mocks.currentDatabaseUser.mockResolvedValue(data[role])
    await expect(listProjectActivity({ projectId: data.projectId })).rejects.toThrow(/permission/)
  })
})
