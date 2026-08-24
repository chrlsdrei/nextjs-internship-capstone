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
type CalendarViewProps = {
  items: CalendarItemDto[]
  onSelectSlot: (slot: SlotInfo) => void
  onSelectEvent: (event: CalendarItemDto) => void
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { locale: enUS }),
  getDay,
  locales: { "en-US": enUS },
})

const sourceLabels = { event: "Event", project: "Project deadline", task: "Task deadline" } as const

export function calendarDisplayDate(value: string, allDay: boolean) {
  if (!allDay) return new Date(value)

  const [year, month, day] = value.slice(0, 10).split("-").map(Number)
  return new Date(year, month - 1, day)
}

function EventLabel({ event }: EventProps<CalendarEvent>) {
  return (
    <span className="calendar-event-content block min-w-0" title={`${event.title} — ${sourceLabels[event.source]}`}>
      <span className="calendar-event-title block truncate font-semibold">{event.title}</span>
      <span className="calendar-event-source block truncate text-[0.68rem] opacity-75">
        {sourceLabels[event.source]}
      </span>
    </span>
  )
}

export function CalendarView({ items, onSelectSlot, onSelectEvent }: CalendarViewProps) {
  const [date, setDate] = useState(new Date())
  const [view, setView] = useState<View>("month")
  const events = useMemo<CalendarEvent[]>(
    () =>
      items.map((item) => ({
        ...item,
        start: calendarDisplayDate(item.startsAt, item.allDay),
        end: calendarDisplayDate(item.endsAt, item.allDay),
      })),
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
        onSelectEvent={onSelectEvent}
        components={{ event: EventLabel }}
        eventPropGetter={(event) => ({ className: `calendar-event calendar-event--${event.source}` })}
        messages={{ showMore: (count) => `+ ${count} more` }}
      />
    </div>
  )
}
