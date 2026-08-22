"use client"

import { useActionState } from "react"

import { EmailNotificationSettings } from "@/components/settings/email-notification-settings"
import { updateEmailNotificationPreferenceAction } from "@/features/notifications/actions/update-email-notification-preference"
import type { EmailNotificationPreferenceDto } from "@/features/notifications/notification.types"
import type { ActionState } from "@/lib/action-state"

const initialPreferenceState: ActionState<{ enabled: boolean }> = { status: "idle" }

export function EmailNotificationSettingsController({ preference }: { preference: EmailNotificationPreferenceDto }) {
  const [state, action, pending] = useActionState(updateEmailNotificationPreferenceAction, initialPreferenceState)
  return <EmailNotificationSettings enabled={preference.enabled} action={action} pending={pending} state={state} />
}
