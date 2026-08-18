"use client"

import { format, getDay, parse, startOfWeek } from "date-fns"
import { enUS } from "date-fns/locale"
import { useMemo, useState } from "react"
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  type EventProps,
  type SlotInfo,
  type View,
} from "react-big-calendar"

import type { CalendarItemDto } from "@/features/calendar/calendar.types"

type CalendarEvent = CalendarItemDto & { start: Date; end: Date }
type CalendarViewProps = { items: CalendarItemDto[]; onSelectSlot: (slot: SlotInfo) => void }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { locale: enUS }),
  getDay,
  locales: { "en-US": enUS },
})

const sourceLabels = { event: "Event", project: "Project deadline", task: "Task deadline" } as const

function EventLabel({ event }: EventProps<CalendarEvent>) {
  return (
    <span className="block min-w-0">
      <span className="block truncate font-semibold">{event.title}</span>
      <span className="block truncate text-[0.68rem] opacity-75">{sourceLabels[event.source]}</span>
    </span>
  )
}

export function CalendarView({ items, onSelectSlot }: CalendarViewProps) {
  const [date, setDate] = useState(new Date())
  const [view, setView] = useState<View>("month")
  const events = useMemo<CalendarEvent[]>(
    () => items.map((item) => ({ ...item, start: new Date(item.startsAt), end: new Date(item.endsAt) })),
    [items],
  )

  return (
    <div className="projectflow-calendar h-[clamp(36rem,72vh,52rem)] min-h-0">
      <BigCalendar<CalendarEvent>
        localizer={localizer}
        events={events}
        date={date}
        view={view}
        views={["month", "week", "day", "agenda"]}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        selectable
        popup
        longPressThreshold={250}
        onNavigate={setDate}
        onView={setView}
        onSelectSlot={onSelectSlot}
        components={{ event: EventLabel }}
        eventPropGetter={(event) => ({ className: `calendar-event calendar-event--${event.source}` })}
        messages={{ showMore: (count) => `+ ${count} more` }}
      />
    </div>
  )
}
