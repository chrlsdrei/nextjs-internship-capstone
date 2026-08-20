"use server"

import { markAllNotificationsRead } from "@/features/notifications/services/notification.service"

export async function markAllNotificationsReadAction() {
  return markAllNotificationsRead()
}
