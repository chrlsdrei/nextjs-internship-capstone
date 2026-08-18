"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"
import { BillingError } from "@/features/billing/billing.error"
import type { CalendarItemDto } from "@/features/calendar/calendar.types"
import { createCalendarEvent } from "@/features/calendar/server/calendar.service"
import { RateLimitError } from "@/features/rate-limits/rate-limit.error"
import type { ActionState } from "@/lib/action-state"
import { actionError, actionSuccess } from "@/lib/action-state"

export async function createCalendarEventAction(input: unknown): Promise<ActionState<CalendarItemDto>> {
  try {
    const event = await createCalendarEvent(input)
    revalidatePath("/calendar")
    return actionSuccess(event, "Event added to the calendar.")
  } catch (error) {
    if (error instanceof ZodError) return actionError(error.issues[0]?.message ?? "Check the event details")
    if (error instanceof BillingError) return actionError(error.message, undefined, { code: error.code })
    if (error instanceof RateLimitError) {
      return actionError(error.message, undefined, { code: error.code, retryAfterSeconds: error.retryAfterSeconds })
    }
    console.error("Calendar event creation failed", error)
    return actionError(error instanceof Error ? error.message : "Unable to create the event")
  }
}
