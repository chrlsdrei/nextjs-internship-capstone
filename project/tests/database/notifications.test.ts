import { randomUUID } from "node:crypto"

import { neon } from "@neondatabase/serverless"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { afterEach, describe, expect, it } from "vitest"

import {
  listNotificationRecords,
  markAllNotificationsReadRecords,
  markNotificationReadRecord,
  materializeInvitationNotification,
  materializeNotificationsForUser,
  materializeTaskAssignmentNotifications,
  materializeTaskCommentNotifications,
} from "../../features/notifications/server/notification.repository"
import * as schema from "../../server/db/schema"
import {
  lists,
  notifications,
  projectMembers,
  projects,
  taskAssignees,
  taskComments,
  tasks,
  users,
  workspaceInvitations,
  workspaceMembers,
  workspaceSettings,
  workspaces,
} from "../../server/db/schema"

const client = neon(process.env.TEST_DATABASE_URL as string)
const database = drizzle({ client, schema })
const workspaceIds = new Set<string>()
const userIds = new Set<string>()

afterEach(async () => {
  for (const userId of userIds) await database.delete(notifications).where(eq(notifications.recipientUserId, userId))
  for (const workspaceId of workspaceIds) await database.delete(workspaces).where(eq(workspaces.id, workspaceId))
  for (const userId of userIds) await database.delete(users).where(eq(users.id, userId))
  workspaceIds.clear()
  userIds.clear()
})

describe("notifications", () => {
  it("materializes every supported source once and scopes read mutations to the recipient", async () => {
    const ownerUserId = randomUUID()
    const recipientUserId = randomUUID()
    const workspaceId = randomUUID()
    const ownerMemberId = randomUUID()
    const recipientMemberId = randomUUID()
    const projectId = randomUUID()
    const ownerProjectMemberId = randomUUID()
    const recipientProjectMemberId = randomUUID()
    const listId = randomUUID()
    const taskId = randomUUID()
    const commentId = randomUUID()
    const workspaceInvitationId = randomUUID()
    const recipientEmail = `recipient-${recipientUserId}@projectflow.test`
    const ownerEmail = `owner-${ownerUserId}@projectflow.test`
    const now = new Date()
    const dueDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1_000)
    workspaceIds.add(workspaceId)
    userIds.add(ownerUserId)
    userIds.add(recipientUserId)

    await database.batch([
      database.insert(users).values([
        {
          id: ownerUserId,
          clerkId: `user_${ownerUserId}`,
          email: ownerEmail,
          normalizedEmail: ownerEmail,
          name: "Notification Owner",
        },
        {
          id: recipientUserId,
          clerkId: `user_${recipientUserId}`,
          email: recipientEmail,
          normalizedEmail: recipientEmail,
          name: "Notification Recipient",
        },
      ]),
      database.insert(workspaces).values({
        id: workspaceId,
        name: "Notification Workspace",
        ownerWorkspaceMemberId: ownerMemberId,
      }),
      database.insert(workspaceMembers).values([
        { id: ownerMemberId, workspaceId, userId: ownerUserId, role: "admin" },
        { id: recipientMemberId, workspaceId, userId: recipientUserId, role: "member" },
      ]),
      database.insert(workspaceSettings).values({ workspaceId }),
      database.insert(projects).values({
        id: projectId,
        workspaceId,
        title: "Notification Board",
        createdByWorkspaceMemberId: ownerMemberId,
      }),
      database.insert(projectMembers).values([
        {
          id: ownerProjectMemberId,
          workspaceId,
          projectId,
          workspaceMemberId: ownerMemberId,
          role: "board_admin",
        },
        {
          id: recipientProjectMemberId,
          workspaceId,
          projectId,
          workspaceMemberId: recipientMemberId,
          role: "editor",
        },
      ]),
      database.insert(lists).values({ id: listId, projectId, name: "To do" }),
      database.insert(tasks).values({ id: taskId, projectId, listId, title: "Notification task", dueDate }),
      database.insert(taskAssignees).values({
        projectId,
        taskId,
        projectMemberId: recipientProjectMemberId,
        assignedByWorkspaceMemberId: ownerMemberId,
      }),
      database.insert(taskComments).values({
        id: commentId,
        workspaceId,
        projectId,
        taskId,
        authorWorkspaceMemberId: ownerMemberId,
        authorName: "Notification Owner",
        authorEmail: ownerEmail,
        content: "Please review this task.",
      }),
      database.insert(workspaceInvitations).values([
        {
          id: workspaceInvitationId,
          kind: "workspace",
          workspaceId,
          invitedByWorkspaceMemberId: ownerMemberId,
          email: recipientEmail,
          normalizedEmail: recipientEmail,
          workspaceRole: "member",
          tokenHash: `workspace-${randomUUID()}`,
          expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1_000),
          deliveryStatus: "sent",
        },
        {
          kind: "project",
          workspaceId,
          projectId,
          invitedByWorkspaceMemberId: ownerMemberId,
          email: recipientEmail,
          normalizedEmail: recipientEmail,
          boardRole: "editor",
          tokenHash: `project-${randomUUID()}`,
          expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1_000),
          deliveryStatus: "sent",
        },
      ]),
    ])

    await materializeInvitationNotification(workspaceInvitationId)
    await materializeTaskAssignmentNotifications(taskId)
    await materializeTaskCommentNotifications(commentId)
    expect((await listNotificationRecords(recipientUserId)).unreadCount).toBe(3)

    await materializeNotificationsForUser(recipientUserId)
    await materializeNotificationsForUser(recipientUserId)
    const initial = await listNotificationRecords(recipientUserId)

    expect(initial.items.map((item) => item.type).sort()).toEqual([
      "project_invitation",
      "task_assigned",
      "task_comment",
      "task_due_soon",
      "workspace_invitation",
    ])
    expect(initial.unreadCount).toBe(5)

    await markNotificationReadRecord(ownerUserId, initial.items[0]?.id ?? "")
    expect((await listNotificationRecords(recipientUserId)).unreadCount).toBe(5)
    await markNotificationReadRecord(recipientUserId, initial.items[0]?.id ?? "")
    expect((await listNotificationRecords(recipientUserId)).unreadCount).toBe(4)
    await markAllNotificationsReadRecords(recipientUserId)
    expect((await listNotificationRecords(recipientUserId)).unreadCount).toBe(0)
  })
})
