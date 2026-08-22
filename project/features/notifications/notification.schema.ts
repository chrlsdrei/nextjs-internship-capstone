import { z } from "zod"

export const notificationIdSchema = z.uuid("Notification ID is invalid")
export const emailNotificationPreferenceSchema = z.object({ enabled: z.boolean() })
