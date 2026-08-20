import "server-only"

import { getNotificationCenterData as getNotificationCenterDataService } from "@/features/notifications/services/notification.service"

export async function getNotificationCenterData(
  ...args: Parameters<typeof getNotificationCenterDataService>
): Promise<Awaited<ReturnType<typeof getNotificationCenterDataService>>> {
  return getNotificationCenterDataService(...args)
}
