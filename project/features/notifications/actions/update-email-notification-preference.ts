"use server"

import { revalidatePath } from "next/cache"

import { updateEmailNotificationPreference } from "@/features/notifications/services/notification.service"
import type { ActionState } from "@/lib/action-state"
import { actionError, actionSuccess } from "@/lib/action-state"

export async function updateEmailNotificationPreferenceAction(
  _: ActionState<{ enabled: boolean }>,
  formData: FormData,
): Promise<ActionState<{ enabled: boolean }>> {
  try {
    const preference = await updateEmailNotificationPreference({ enabled: formData.get("enabled") === "true" })
    revalidatePath("/settings")
    return actionSuccess(preference, "Email notification preference saved.")
  } catch (error) {
    console.error("Email notification preference update failed", error)
    return actionError("The preference could not be saved. Please try again.")
  }
}
