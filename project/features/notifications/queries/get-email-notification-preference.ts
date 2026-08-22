import "server-only"

import { getEmailNotificationPreference as getEmailNotificationPreferenceService } from "@/features/notifications/services/notification.service"

export async function getEmailNotificationPreference() {
  return getEmailNotificationPreferenceService()
}
