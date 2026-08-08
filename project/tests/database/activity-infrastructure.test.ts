import { randomUUID } from "node:crypto"

import { neon } from "@neondatabase/serverless"
import { eq, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { afterEach, describe, expect, it } from "vitest"

import { recordActivity } from "../../features/activity/server/activity.service"
import { findProjectAccess } from "../../features/members/server/member.repository"
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

async function fixture(label: string) {
  const ownerId = randomUUID()
  const workspaceId = randomUUID()
  const ownerMemberId = randomUUID()
  const projectId = randomUUID()
  const listId = randomUUID()
  const taskId = randomUUID()
  const email = `${label}-${ownerId}@projectflow.test`
  await database.batch([
    database.insert(users).values({
      id: ownerId,
      clerkId: `user_${ownerId}`,
      email,
      normalizedEmail: email,
      name: `Owner ${label}`,
    }),
    database
      .insert(workspaces)
      .values({ id: workspaceId, name: `Workspace ${label}`, ownerWorkspaceMemberId: ownerMemberId }),
    database.insert(workspaceMembers).values({ id: ownerMemberId, workspaceId, userId: ownerId, role: "admin" }),
    database.insert(workspaceSettings).values({ workspaceId }),
    database.insert(projects).values({
      id: projectId,
      workspaceId,
      title: `Project ${label}`,
      createdByWorkspaceMemberId: ownerMemberId,
    }),
    database.insert(lists).values({ id: listId, projectId, name: "To do" }),
    database.insert(tasks).values({ id: taskId, projectId, listId, title: "Persistent snapshot" }),
  ])
  workspaceIds.add(workspaceId)
  userIds.add(ownerId)
  return { ownerId, ownerMemberId, workspaceId, projectId, taskId }
}

afterEach(async () => {
  await database.execute(sql`TRUNCATE TABLE "activity_logs"`)
  for (const workspaceId of workspaceIds) await database.delete(workspaces).where(eq(workspaces.id, workspaceId))
  for (const userId of userIds) await database.delete(users).where(eq(users.id, userId))
  workspaceIds.clear()
  userIds.clear()
})

describe("append-only activity persistence", () => {
  it("stores validated activity and rejects application updates and deletes", async () => {
    const data = await fixture("append-only")
    const activity = await recordActivity({
      workspaceId: data.workspaceId,
      projectId: data.projectId,
      taskId: data.taskId,
      actorWorkspaceMemberId: data.ownerMemberId,
      event: {
        action: "task.created",
        metadata: {
          actorName: "Owner append-only",
          workspaceName: "Workspace append-only",
          projectTitle: "Project append-only",
          taskTitle: "Persistent snapshot",
        },
      },
    })
    await expect(
      database.update(activityLogs).set({ action: "task.updated" }).where(eq(activityLogs.id, activity.id)),
    ).rejects.toMatchObject({ cause: { code: "55000" } })
    await expect(database.delete(activityLogs).where(eq(activityLogs.id, activity.id))).rejects.toMatchObject({
      cause: { code: "55000" },
    })
  })

  it("keeps safe metadata when task and project references are deleted", async () => {
    const data = await fixture("snapshots")
    const activity = await recordActivity({
      workspaceId: data.workspaceId,
      projectId: data.projectId,
      taskId: data.taskId,
      actorWorkspaceMemberId: data.ownerMemberId,
      event: {
        action: "task.deleted",
        metadata: {
          actorName: "Owner snapshots",
          workspaceName: "Workspace snapshots",
          projectTitle: "Project snapshots",
          taskTitle: "Persistent snapshot",
        },
      },
    })
    await database.delete(tasks).where(eq(tasks.id, data.taskId))
    await database.delete(projects).where(eq(projects.id, data.projectId))
    const [stored] = await database.select().from(activityLogs).where(eq(activityLogs.id, activity.id))
    expect(stored.projectId).toBeNull()
    expect(stored.taskId).toBeNull()
    expect(stored.metadata).toMatchObject({ projectTitle: "Project snapshots", taskTitle: "Persistent snapshot" })
  })

  it("rejects cross-workspace actor references and does not grant access from system role", async () => {
    const first = await fixture("first")
    const second = await fixture("second")
    await expect(
      recordActivity({
        workspaceId: first.workspaceId,
        projectId: first.projectId,
        actorWorkspaceMemberId: second.ownerMemberId,
        event: {
          action: "project.updated",
          metadata: {
            actorName: "Other owner",
            workspaceName: "Workspace first",
            projectTitle: "Project first",
          },
        },
      }),
    ).rejects.toThrow(/same workspace/)
    await database.update(users).set({ systemRole: "super_admin" }).where(eq(users.id, second.ownerId))
    expect(await findProjectAccess(first.projectId, second.ownerId)).toBeNull()
  })
})
