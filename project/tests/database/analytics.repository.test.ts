import { randomUUID } from "node:crypto"

import { neon } from "@neondatabase/serverless"
import { eq, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { afterEach, describe, expect, it } from "vitest"

import {
  countRecentContributors,
  readCompletionContributions,
  readProjectProgress,
  readRecentActivity,
} from "../../features/analytics/repositories/analytics.repository"
import * as schema from "../../server/db/schema"
import {
  activityLogs,
  lists,
  projects,
  tasks,
  users,
  workspaceMembers,
  workspaceSettings,
  workspaces,
} from "../../server/db/schema"

const client = neon(process.env.TEST_DATABASE_URL as string)
const database = drizzle({ client, schema })
const workspaceIds = new Set<string>()
const userIds = new Set<string>()

afterEach(async () => {
  await database.execute(sql`TRUNCATE TABLE "activity_logs"`)
  for (const workspaceId of workspaceIds) await database.delete(workspaces).where(eq(workspaces.id, workspaceId))
  for (const userId of userIds) await database.delete(users).where(eq(users.id, userId))
  workspaceIds.clear()
  userIds.clear()
})

describe("analytics repository", () => {
  it("counts current completed tasks and historical moves into completion lists", async () => {
    const userId = randomUUID()
    const workspaceId = randomUUID()
    const memberId = randomUUID()
    const projectId = randomUUID()
    const todoListId = randomUUID()
    const doneListId = randomUUID()
    const completedTaskId = randomUUID()
    const openTaskId = randomUUID()
    const email = `analytics-${userId}@projectflow.test`
    workspaceIds.add(workspaceId)
    userIds.add(userId)

    await database.batch([
      database.insert(users).values({
        id: userId,
        clerkId: `user_${userId}`,
        email,
        normalizedEmail: email,
        name: "Analytics Owner",
      }),
      database.insert(workspaces).values({ id: workspaceId, name: "Analytics", ownerWorkspaceMemberId: memberId }),
      database.insert(workspaceMembers).values({ id: memberId, workspaceId, userId, role: "admin" }),
      database.insert(workspaceSettings).values({ workspaceId }),
      database.insert(projects).values({
        id: projectId,
        workspaceId,
        title: "Tracked project",
        createdByWorkspaceMemberId: memberId,
      }),
      database.insert(lists).values([
        { id: todoListId, projectId, name: "To do", position: 0 },
        { id: doneListId, projectId, name: "Done", position: 1 },
      ]),
      database.insert(tasks).values([
        { id: completedTaskId, projectId, listId: doneListId, title: "Completed task", position: 0 },
        { id: openTaskId, projectId, listId: todoListId, title: "Open task", position: 0 },
      ]),
      database.insert(activityLogs).values([
        {
          workspaceId,
          projectId,
          taskId: completedTaskId,
          actorWorkspaceMemberId: memberId,
          action: "task.moved",
          metadata: { sourceListName: "To do", targetListName: "Done" },
          createdAt: new Date("2026-08-18T04:00:00.000Z"),
        },
        {
          workspaceId,
          projectId,
          taskId: openTaskId,
          actorWorkspaceMemberId: memberId,
          action: "task.moved",
          metadata: { sourceListName: "Done", targetListName: "To do" },
          createdAt: new Date("2026-08-19T04:00:00.000Z"),
        },
      ]),
    ])

    await expect(readProjectProgress([projectId])).resolves.toEqual([
      { id: projectId, title: "Tracked project", totalTasks: 2, completedTasks: 1 },
    ])
    await expect(
      readCompletionContributions(
        [projectId],
        new Date("2025-12-31T16:00:00.000Z"),
        new Date("2026-12-31T16:00:00.000Z"),
      ),
    ).resolves.toEqual([{ date: "2026-08-18", count: 1 }])
    await expect(readRecentActivity([projectId], new Date("2026-08-01T00:00:00.000Z"))).resolves.toEqual([
      { date: "2026-08-18", count: 1 },
      { date: "2026-08-19", count: 1 },
    ])
    await expect(countRecentContributors([projectId], new Date("2026-08-01T00:00:00.000Z"))).resolves.toBe(1)
  })
})
