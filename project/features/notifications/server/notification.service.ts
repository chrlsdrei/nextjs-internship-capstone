import "server-only"

import { getCurrentDatabaseUser } from "@/features/auth/server/session.service"
import { notificationIdSchema } from "@/features/notifications/notification.schema"
import type {
  NotificationCenterDto,
  NotificationDto,
  NotificationType,
} from "@/features/notifications/notification.types"
import { notificationTypes } from "@/features/notifications/notification.types"
import {
  listNotificationRecords,
  markAllNotificationsReadRecords,
  markNotificationReadRecord,
  materializeInvitationNotification,
  materializeNotificationsForUser,
  materializeTaskAssignmentNotifications,
  materializeTaskCommentNotifications,
} from "@/features/notifications/server/notification.repository"

const supportedTypes = new Set<string>(notificationTypes)

function notificationDto(
  record: Awaited<ReturnType<typeof listNotificationRecords>>["items"][number],
): NotificationDto {
  if (!supportedTypes.has(record.type)) throw new Error(`Unsupported notification type: ${record.type}`)
  return {
    id: record.id,
    type: record.type as NotificationType,
    title: record.title,
    message: record.message,
    href: record.href,
    readAt: record.readAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
  }
}

async function notificationCenterForUser(userId: string): Promise<NotificationCenterDto> {
  await materializeNotificationsForUser(userId)
  const records = await listNotificationRecords(userId)
  return { items: records.items.map(notificationDto), unreadCount: records.unreadCount }
}

export async function getNotificationCenterData() {
  const user = await getCurrentDatabaseUser()
  return notificationCenterForUser(user.id)
}

export async function markNotificationRead(notificationId: string) {
  const user = await getCurrentDatabaseUser()
  await markNotificationReadRecord(user.id, notificationIdSchema.parse(notificationId))
  return notificationCenterForUser(user.id)
}

export async function markAllNotificationsRead() {
  const user = await getCurrentDatabaseUser()
  await markAllNotificationsReadRecords(user.id)
  return notificationCenterForUser(user.id)
}

async function publishBestEffort(operation: () => Promise<void>) {
  try {
    await operation()
  } catch {
    console.error("A notification could not be materialized; the polling backfill will retry it.")
  }
}

export async function publishInvitationNotification(invitationId: string) {
  await publishBestEffort(() => materializeInvitationNotification(invitationId))
}

export async function publishTaskAssignmentNotifications(taskId: string) {
  await publishBestEffort(() => materializeTaskAssignmentNotifications(taskId))
}

export async function publishTaskCommentNotifications(commentId: string) {
  await publishBestEffort(() => materializeTaskCommentNotifications(commentId))
}
