"use server"

import { markNotificationRead } from "@/features/notifications/services/notification.service"

export async function markNotificationReadAction(notificationId: string) {
  return markNotificationRead(notificationId)
}
