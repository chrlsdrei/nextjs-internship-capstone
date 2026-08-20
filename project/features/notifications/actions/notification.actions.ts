"use server"

import {
  getNotificationCenterData,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/server/notification.service"

export async function loadNotificationsAction() {
  return getNotificationCenterData()
}

export async function markNotificationReadAction(notificationId: string) {
  return markNotificationRead(notificationId)
}

export async function markAllNotificationsReadAction() {
  return markAllNotificationsRead()
}
