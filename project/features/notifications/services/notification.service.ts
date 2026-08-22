import "server-only"

import { getCurrentDatabaseUser } from "@/features/auth/services/session.service"
import { sendNotificationEmail } from "@/features/notifications/gateways/notification-email.gateway"
import { emailNotificationPreferenceSchema, notificationIdSchema } from "@/features/notifications/notification.schema"
import type {
  EmailNotificationPreferenceDto,
  NotificationCenterDto,
  NotificationDto,
  NotificationType,
} from "@/features/notifications/notification.types"
import { notificationTypes } from "@/features/notifications/notification.types"
import {
  claimPendingNotificationEmailRecords,
  getEmailNotificationPreferenceRecord,
  listNotificationRecords,
  markAllNotificationsReadRecords,
  markNotificationReadRecord,
  materializeDeadlineNotificationsForAllUsers,
  materializeInvitationNotification,
  materializeNotificationsForUser,
  materializeTaskAssignmentNotifications,
  materializeTaskCommentNotifications,
  recordNotificationEmailFailure,
  recordNotificationEmailSent,
  skipPendingNotificationEmailsForUser,
  updateEmailNotificationPreferenceRecord,
} from "@/features/notifications/repositories/notification.repository"

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

export async function getEmailNotificationPreference(): Promise<EmailNotificationPreferenceDto> {
  const user = await getCurrentDatabaseUser()
  const preference = await getEmailNotificationPreferenceRecord(user.id)
  if (!preference) throw new Error("Notification preferences could not be loaded")
  return preference
}

export async function updateEmailNotificationPreference(input: unknown): Promise<EmailNotificationPreferenceDto> {
  const user = await getCurrentDatabaseUser()
  const values = emailNotificationPreferenceSchema.parse(input)
  const preference = await updateEmailNotificationPreferenceRecord(user.id, values.enabled)
  if (!preference) throw new Error("Notification preferences could not be updated")
  if (!values.enabled) await skipPendingNotificationEmailsForUser(user.id)
  return preference
}

export async function deliverPendingNotificationEmails() {
  const records = await claimPendingNotificationEmailRecords()
  const results = await Promise.allSettled(
    records.map(async (record) => {
      if (!supportedTypes.has(record.type)) {
        await recordNotificationEmailFailure(record.id, "UNSUPPORTED_NOTIFICATION_TYPE")
        return
      }
      try {
        await sendNotificationEmail({
          notificationId: record.id,
          recipientEmail: record.recipientEmail,
          recipientName: record.recipientName,
          type: record.type as NotificationType,
          title: record.title,
          message: record.message,
          href: record.href,
          createdAt: new Date(record.createdAt),
        })
        await recordNotificationEmailSent(record.id)
      } catch (error) {
        const code = error instanceof Error ? error.message.slice(0, 120) : "EMAIL_DELIVERY_FAILED"
        await recordNotificationEmailFailure(record.id, code)
      }
    }),
  )
  return {
    claimed: records.length,
    completed: results.filter((result) => result.status === "fulfilled").length,
  }
}

export async function processScheduledNotificationEmails() {
  await materializeDeadlineNotificationsForAllUsers()
  return deliverPendingNotificationEmails()
}

async function publishBestEffort(operation: () => Promise<unknown>) {
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
  await publishBestEffort(async () => {
    await materializeTaskAssignmentNotifications(taskId)
    await deliverPendingNotificationEmails()
  })
}

export async function publishTaskCommentNotifications(commentId: string) {
  await publishBestEffort(async () => {
    await materializeTaskCommentNotifications(commentId)
    await deliverPendingNotificationEmails()
  })
}
