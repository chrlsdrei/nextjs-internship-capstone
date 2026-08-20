"use server"

import { getNotificationCenterData } from "@/features/notifications/services/notification.service"

export async function loadNotificationsAction() {
  return getNotificationCenterData()
}
