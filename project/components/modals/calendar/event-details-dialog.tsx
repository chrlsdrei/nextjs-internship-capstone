"use client"

import { AlignLeft, Building2, CalendarDays, Clock3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import type { CalendarItemDto } from "@/features/calendar/calendar.types"

const dateFormatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "long" })
const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeStyle: "short" })

function localCalendarDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number)
  return new Date(year, month - 1, day)
}

function eventSchedule(event: CalendarItemDto) {
  if (!event.allDay) {
    return `${dateTimeFormatter.format(new Date(event.startsAt))} – ${dateTimeFormatter.format(new Date(event.endsAt))}`
  }

  const start = localCalendarDate(event.startsAt)
  const inclusiveEnd = localCalendarDate(event.endsAt)
  inclusiveEnd.setDate(inclusiveEnd.getDate() - 1)
  const startLabel = dateFormatter.format(start)
  const endLabel = dateFormatter.format(inclusiveEnd)
  return startLabel === endLabel ? `${startLabel} · All day` : `${startLabel} – ${endLabel} · All day`
}

export function EventDetailsDialog({ event, onClose }: { event: CalendarItemDto | null; onClose: () => void }) {
  return (
    <Modal
      open={event !== null}
      onClose={onClose}
      title={event?.title ?? "Calendar event"}
      description="Workspace event details"
      footer={
        <div className="flex justify-end">
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      {event && (
        <dl className="space-y-4 px-1">
          <div className="rounded-lg border border-cyan-400/20 bg-cyan-950/25 p-4">
            <dt className="flex items-center gap-2 font-semibold text-cyan-100 text-sm">
              <Building2 className="size-4 text-cyan-300" /> Workspace
            </dt>
            <dd className="mt-2 text-white">{event.workspaceName}</dd>
          </div>
          <div className="rounded-lg border border-cyan-400/20 bg-cyan-950/25 p-4">
            <dt className="flex items-center gap-2 font-semibold text-cyan-100 text-sm">
              {event.allDay ? (
                <CalendarDays className="size-4 text-cyan-300" />
              ) : (
                <Clock3 className="size-4 text-cyan-300" />
              )}
              Schedule
            </dt>
            <dd className="mt-2 text-white">{eventSchedule(event)}</dd>
          </div>
          <div className="rounded-lg border border-cyan-400/20 bg-cyan-950/25 p-4">
            <dt className="flex items-center gap-2 font-semibold text-cyan-100 text-sm">
              <AlignLeft className="size-4 text-cyan-300" /> Description
            </dt>
            <dd className="mt-2 whitespace-pre-wrap break-words text-cyan-50/85">
              {event.description || "No description was provided for this event."}
            </dd>
          </div>
        </dl>
      )}
    </Modal>
  )
}
