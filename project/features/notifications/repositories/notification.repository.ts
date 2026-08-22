import "server-only"

import { and, count, desc, eq, isNull, sql } from "drizzle-orm"

import { db } from "@/server/db/client"
import { notifications, users } from "@/server/db/schema"

async function materializeInvitationNotifications(userId: string | null, invitationId: string | null = null) {
  const result = await db.execute<{ id: string }>(sql`
    INSERT INTO "notifications" (
      "recipient_user_id", "actor_user_id", "workspace_id", "project_id",
      "type", "dedupe_key", "title", "message", "href", "email_delivery_status", "email_sent_at", "created_at"
    )
    SELECT
      "recipient"."id", "actor"."id", "invitation"."workspace_id", "invitation"."project_id",
      CASE WHEN "invitation"."kind" = 'workspace' THEN 'workspace_invitation' ELSE 'project_invitation' END,
      'invitation:' || "invitation"."id"::text,
      CASE WHEN "invitation"."kind" = 'workspace' THEN 'Workspace invitation' ELSE 'Board invitation' END,
      CASE
        WHEN "invitation"."kind" = 'workspace'
          THEN COALESCE("actor"."name", 'A workspace administrator') || ' invited you to ' || "workspace"."name" || '. Check your email to accept.'
        ELSE COALESCE("actor"."name", 'A board administrator') || ' invited you to ' || COALESCE("project"."title", 'a board') || '. Check your email to accept.'
      END,
      NULL,
      'sent',
      "invitation"."last_sent_at",
      "invitation"."created_at"
    FROM "workspace_invitations" AS "invitation"
    INNER JOIN "users" AS "recipient"
      ON "recipient"."normalized_email" = "invitation"."normalized_email"
      AND (${userId}::uuid IS NULL OR "recipient"."id" = ${userId})
      AND "recipient"."account_status" = 'active'
    INNER JOIN "workspaces" AS "workspace" ON "workspace"."id" = "invitation"."workspace_id"
    LEFT JOIN "projects" AS "project" ON "project"."id" = "invitation"."project_id"
    LEFT JOIN "workspace_members" AS "inviter_member" ON "inviter_member"."id" = "invitation"."invited_by_workspace_member_id"
    LEFT JOIN "users" AS "actor" ON "actor"."id" = "inviter_member"."user_id"
    WHERE "invitation"."accepted_at" IS NULL
      AND "invitation"."revoked_at" IS NULL
      AND "invitation"."expires_at" > NOW()
      AND "invitation"."delivery_status" = 'sent'
      AND (${invitationId}::uuid IS NULL OR "invitation"."id" = ${invitationId})
    ON CONFLICT ("recipient_user_id", "dedupe_key") DO NOTHING
    RETURNING "id"
  `)
  return result.rows.map((row) => row.id)
}

async function materializeAssignmentNotifications(userId: string | null, taskId: string | null = null) {
  const result = await db.execute<{ id: string }>(sql`
    INSERT INTO "notifications" (
      "recipient_user_id", "actor_user_id", "workspace_id", "project_id", "task_id",
      "type", "dedupe_key", "title", "message", "href", "created_at"
    )
    SELECT
      "recipient"."id", "actor"."id", "project"."workspace_id", "task"."project_id", "task"."id",
      'task_assigned',
      'task-assigned:' || "task"."id"::text || ':' || "assignment"."project_member_id"::text || ':' ||
        to_char("assignment"."assigned_at" AT TIME ZONE 'UTC', 'YYYYMMDDHH24MISSUS'),
      'You were assigned a task',
      COALESCE("actor"."name", 'A project member') || ' assigned you to “' || "task"."title" || '” in ' || "project"."title" || '.',
      '/projects/' || "task"."project_id"::text,
      "assignment"."assigned_at"
    FROM "task_assignees" AS "assignment"
    INNER JOIN "tasks" AS "task" ON "task"."id" = "assignment"."task_id"
    INNER JOIN "projects" AS "project" ON "project"."id" = "task"."project_id"
    INNER JOIN "project_members" AS "recipient_project_member"
      ON "recipient_project_member"."id" = "assignment"."project_member_id"
      AND "recipient_project_member"."removed_at" IS NULL
    INNER JOIN "workspace_members" AS "recipient_workspace_member"
      ON "recipient_workspace_member"."id" = "recipient_project_member"."workspace_member_id"
      AND "recipient_workspace_member"."removed_at" IS NULL
    INNER JOIN "users" AS "recipient"
      ON "recipient"."id" = "recipient_workspace_member"."user_id"
      AND (${userId}::uuid IS NULL OR "recipient"."id" = ${userId})
      AND "recipient"."account_status" = 'active'
    LEFT JOIN "workspace_members" AS "actor_member" ON "actor_member"."id" = "assignment"."assigned_by_workspace_member_id"
    LEFT JOIN "users" AS "actor" ON "actor"."id" = "actor_member"."user_id"
    WHERE "actor"."id" IS DISTINCT FROM "recipient"."id"
      AND (${taskId}::uuid IS NULL OR "task"."id" = ${taskId})
    ON CONFLICT ("recipient_user_id", "dedupe_key") DO NOTHING
    RETURNING "id"
  `)
  return result.rows.map((row) => row.id)
}

async function materializeCommentNotifications(userId: string | null, commentId: string | null = null) {
  const result = await db.execute<{ id: string }>(sql`
    INSERT INTO "notifications" (
      "recipient_user_id", "actor_user_id", "workspace_id", "project_id", "task_id",
      "type", "dedupe_key", "title", "message", "href", "created_at"
    )
    SELECT
      "recipient"."id", "author"."id", "comment"."workspace_id", "comment"."project_id", "comment"."task_id",
      'task_comment',
      'task-comment:' || "comment"."id"::text || ':' || "recipient"."id"::text,
      'New comment on an assigned task',
      COALESCE("author"."name", "comment"."author_name") || ' commented on “' || "task"."title" || '” in ' || "project"."title" || '.',
      '/projects/' || "comment"."project_id"::text,
      "comment"."created_at"
    FROM "task_comments" AS "comment"
    INNER JOIN "tasks" AS "task" ON "task"."id" = "comment"."task_id"
    INNER JOIN "projects" AS "project" ON "project"."id" = "comment"."project_id"
    INNER JOIN "task_assignees" AS "assignment" ON "assignment"."task_id" = "comment"."task_id"
    INNER JOIN "project_members" AS "recipient_project_member"
      ON "recipient_project_member"."id" = "assignment"."project_member_id"
      AND "recipient_project_member"."removed_at" IS NULL
    INNER JOIN "workspace_members" AS "recipient_workspace_member"
      ON "recipient_workspace_member"."id" = "recipient_project_member"."workspace_member_id"
      AND "recipient_workspace_member"."removed_at" IS NULL
    INNER JOIN "users" AS "recipient"
      ON "recipient"."id" = "recipient_workspace_member"."user_id"
      AND (${userId}::uuid IS NULL OR "recipient"."id" = ${userId})
      AND "recipient"."account_status" = 'active'
    LEFT JOIN "workspace_members" AS "author_member" ON "author_member"."id" = "comment"."author_workspace_member_id"
    LEFT JOIN "users" AS "author" ON "author"."id" = "author_member"."user_id"
    WHERE "comment"."deleted_at" IS NULL
      AND "author"."id" IS DISTINCT FROM "recipient"."id"
      AND (${commentId}::uuid IS NULL OR "comment"."id" = ${commentId})
    ON CONFLICT ("recipient_user_id", "dedupe_key") DO NOTHING
    RETURNING "id"
  `)
  return result.rows.map((row) => row.id)
}

async function materializeDeadlineNotifications(userId: string | null) {
  const result = await db.execute<{ id: string }>(sql`
    INSERT INTO "notifications" (
      "recipient_user_id", "workspace_id", "project_id", "task_id",
      "type", "dedupe_key", "title", "message", "href", "created_at"
    )
    SELECT
      "recipient"."id", "project"."workspace_id", "task"."project_id", "task"."id",
      'task_due_soon',
      'task-due:' || "task"."id"::text || ':' || to_char("task"."due_date" AT TIME ZONE 'UTC', 'YYYYMMDDHH24MISSUS'),
      'Task deadline approaching',
      '“' || "task"."title" || '” in ' || "project"."title" || ' is due on ' ||
        to_char("task"."due_date" AT TIME ZONE 'Asia/Manila', 'Mon DD, YYYY') || '.',
      '/projects/' || "task"."project_id"::text,
      NOW()
    FROM "task_assignees" AS "assignment"
    INNER JOIN "tasks" AS "task" ON "task"."id" = "assignment"."task_id"
    INNER JOIN "projects" AS "project" ON "project"."id" = "task"."project_id"
    INNER JOIN "project_members" AS "recipient_project_member"
      ON "recipient_project_member"."id" = "assignment"."project_member_id"
      AND "recipient_project_member"."removed_at" IS NULL
    INNER JOIN "workspace_members" AS "recipient_workspace_member"
      ON "recipient_workspace_member"."id" = "recipient_project_member"."workspace_member_id"
      AND "recipient_workspace_member"."removed_at" IS NULL
    INNER JOIN "users" AS "recipient"
      ON "recipient"."id" = "recipient_workspace_member"."user_id"
      AND (${userId}::uuid IS NULL OR "recipient"."id" = ${userId})
      AND "recipient"."account_status" = 'active'
    WHERE "task"."due_date" >= NOW()
      AND "task"."due_date" <= NOW() + INTERVAL '3 days'
    ON CONFLICT ("recipient_user_id", "dedupe_key") DO NOTHING
    RETURNING "id"
  `)
  return result.rows.map((row) => row.id)
}

export async function materializeNotificationsForUser(userId: string) {
  const notificationIds = await Promise.all([
    materializeInvitationNotifications(userId),
    materializeAssignmentNotifications(userId),
    materializeCommentNotifications(userId),
    materializeDeadlineNotifications(userId),
  ])
  return notificationIds.flat()
}

export async function materializeInvitationNotification(invitationId: string) {
  return materializeInvitationNotifications(null, invitationId)
}

export async function materializeTaskAssignmentNotifications(taskId: string) {
  return materializeAssignmentNotifications(null, taskId)
}

export async function materializeTaskCommentNotifications(commentId: string) {
  return materializeCommentNotifications(null, commentId)
}

export async function materializeDeadlineNotificationsForAllUsers() {
  return materializeDeadlineNotifications(null)
}

export type NotificationEmailRecord = {
  id: string
  type: string
  title: string
  message: string
  href: string | null
  createdAt: Date | string
  deliveryAttempt: number
  recipientEmail: string
  recipientName: string
}

export async function claimPendingNotificationEmailRecords(limit = 50) {
  await db.execute(sql`
    UPDATE "notifications" AS "notification"
    SET "email_delivery_status" = 'skipped',
        "email_delivery_error_code" = 'EMAIL_NOTIFICATIONS_DISABLED'
    FROM "users" AS "recipient"
    WHERE "recipient"."id" = "notification"."recipient_user_id"
      AND "recipient"."email_notifications_enabled" = false
      AND "notification"."email_delivery_status" IN ('pending', 'failed')
      AND "notification"."type" NOT IN ('workspace_invitation', 'project_invitation')
  `)

  const result = await db.execute<NotificationEmailRecord>(sql`
    WITH "candidates" AS (
      SELECT "notification"."id"
      FROM "notifications" AS "notification"
      INNER JOIN "users" AS "recipient" ON "recipient"."id" = "notification"."recipient_user_id"
      WHERE "notification"."email_delivery_status" IN ('pending', 'failed')
        AND "notification"."email_delivery_attempt" < 5
        AND "notification"."created_at" >= NOW() - INTERVAL '7 days'
        AND "notification"."type" NOT IN ('workspace_invitation', 'project_invitation')
        AND "recipient"."email_notifications_enabled" = true
        AND "recipient"."account_status" = 'active'
      ORDER BY "notification"."created_at", "notification"."id"
      LIMIT ${limit}
      FOR UPDATE OF "notification" SKIP LOCKED
    )
    UPDATE "notifications" AS "notification"
    SET "email_delivery_status" = 'sending',
        "email_delivery_attempt" = "notification"."email_delivery_attempt" + 1,
        "email_delivery_error_code" = NULL
    FROM "candidates", "users" AS "recipient"
    WHERE "notification"."id" = "candidates"."id"
      AND "recipient"."id" = "notification"."recipient_user_id"
    RETURNING
      "notification"."id",
      "notification"."type",
      "notification"."title",
      "notification"."message",
      "notification"."href",
      "notification"."created_at" AS "createdAt",
      "notification"."email_delivery_attempt" AS "deliveryAttempt",
      "recipient"."email" AS "recipientEmail",
      "recipient"."name" AS "recipientName"
  `)
  return result.rows
}

export async function recordNotificationEmailSent(notificationId: string) {
  await db
    .update(notifications)
    .set({ emailDeliveryStatus: "sent", emailSentAt: new Date(), emailDeliveryErrorCode: null })
    .where(eq(notifications.id, notificationId))
}

export async function recordNotificationEmailFailure(notificationId: string, errorCode: string) {
  await db
    .update(notifications)
    .set({ emailDeliveryStatus: "failed", emailDeliveryErrorCode: errorCode })
    .where(eq(notifications.id, notificationId))
}

export async function skipPendingNotificationEmailsForUser(userId: string) {
  await db
    .update(notifications)
    .set({ emailDeliveryStatus: "skipped", emailDeliveryErrorCode: "EMAIL_NOTIFICATIONS_DISABLED" })
    .where(
      and(
        eq(notifications.recipientUserId, userId),
        sql`${notifications.emailDeliveryStatus} IN ('pending', 'failed')`,
      ),
    )
}

export async function listNotificationRecords(userId: string, limit = 40) {
  const [items, [unread]] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientUserId, userId))
      .orderBy(desc(notifications.createdAt), desc(notifications.id))
      .limit(limit),
    db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.recipientUserId, userId), isNull(notifications.readAt))),
  ])
  return { items, unreadCount: unread?.count ?? 0 }
}

export async function markNotificationReadRecord(userId: string, notificationId: string) {
  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.recipientUserId, userId),
        isNull(notifications.readAt),
      ),
    )
    .returning({ id: notifications.id })
  return updated ?? null
}

export async function markAllNotificationsReadRecords(userId: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.recipientUserId, userId), isNull(notifications.readAt)))
}

export async function getEmailNotificationPreferenceRecord(userId: string) {
  const [preference] = await db
    .select({ enabled: users.emailNotificationsEnabled })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return preference ?? null
}

export async function updateEmailNotificationPreferenceRecord(userId: string, enabled: boolean) {
  const [preference] = await db
    .update(users)
    .set({ emailNotificationsEnabled: enabled, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ enabled: users.emailNotificationsEnabled })
  return preference ?? null
}
