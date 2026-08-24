"use client"

import { useActionState, useEffect, useState } from "react"

import { AccountPreferences } from "@/components/settings/account-preferences"
import { updateEmailNotificationPreferenceAction } from "@/features/notifications/actions/update-email-notification-preference"
import type { EmailNotificationPreferenceDto } from "@/features/notifications/notification.types"
import type { ActionState } from "@/lib/action-state"
import {
  applyReduceMotionPreference,
  readReduceMotionPreference,
  saveReduceMotionPreference,
} from "@/lib/motion-preference"

const initialPreferenceState: ActionState<{ enabled: boolean }> = { status: "idle" }

export function AccountPreferencesController({ preference }: { preference: EmailNotificationPreferenceDto }) {
  const [emailState, emailAction, emailPending] = useActionState(
    updateEmailNotificationPreferenceAction,
    initialPreferenceState,
  )
  const [reduceMotion, setReduceMotion] = useState(false)
  const [motionReady, setMotionReady] = useState(false)

  useEffect(() => {
    const enabled = readReduceMotionPreference()
    setReduceMotion(enabled)
    applyReduceMotionPreference(enabled)
    setMotionReady(true)
  }, [])

  const updateReduceMotion = (enabled: boolean) => {
    setReduceMotion(enabled)
    saveReduceMotionPreference(enabled)
  }

  return (
    <AccountPreferences
      emailEnabled={preference.enabled}
      emailAction={emailAction}
      emailPending={emailPending}
      emailState={emailState}
      reduceMotion={reduceMotion}
      motionReady={motionReady}
      onReduceMotionChange={updateReduceMotion}
    />
  )
}
