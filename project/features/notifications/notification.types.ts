export const notificationTypes = [
  "workspace_invitation",
  "project_invitation",
  "task_assigned",
  "task_comment",
  "task_due_soon",
] as const

export type NotificationType = (typeof notificationTypes)[number]

export type NotificationDto = {
  id: string
  type: NotificationType
  title: string
  message: string
  href: string | null
  readAt: string | null
  createdAt: string
}

export type NotificationCenterDto = {
  items: NotificationDto[]
  unreadCount: number
}

export type EmailNotificationPreferenceDto = {
  enabled: boolean
}
