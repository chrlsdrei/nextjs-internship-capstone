"use client"

import { CalendarPlus } from "lucide-react"
import { useState, useTransition } from "react"
import type { SlotInfo } from "react-big-calendar"
import { CalendarView } from "@/components/calendar/calendar-view"
import { UpcomingDeadlines } from "@/components/calendar/upcoming-deadlines"
import { type CalendarEventForm, CreateEventDialog } from "@/components/modals/calendar/create-event-dialog"
import { Button } from "@/components/ui/button"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import { createCalendarEventAction } from "@/features/calendar/actions/create-calendar-event"
import type { CalendarPageDto } from "@/features/calendar/calendar.types"

function toLocalInput(date: Date, allDay: boolean) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, allDay ? 10 : 16)
}

function initialForm(
  workspaceId: string,
  start = new Date(),
  end = new Date(Date.now() + 60 * 60 * 1000),
): CalendarEventForm {
  return {
    workspaceId,
    title: "",
    description: "",
    allDay: false,
    startsAt: toLocalInput(start, false),
    endsAt: toLocalInput(end, false),
  }
}

export function CalendarController({ initialData }: { initialData: CalendarPageDto }) {
  const [items, setItems] = useState(initialData.items)
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<CalendarEventForm>(() => initialForm(initialData.workspaces[0]?.id ?? ""))
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const openDefault = () => {
    setValues(initialForm(initialData.workspaces[0]?.id ?? ""))
    setError(null)
    setOpen(true)
  }
  const openForSlot = (slot: SlotInfo) => {
    const allDay = slot.slots.length > 0 && slot.start.getHours() === 0
    const end = slot.end > slot.start ? slot.end : new Date(slot.start.getTime() + 60 * 60 * 1000)
    const displayedEnd = allDay ? new Date(end.getTime() - 24 * 60 * 60 * 1000) : end
    setValues({
      ...initialForm(initialData.workspaces[0]?.id ?? "", slot.start, end),
      allDay,
      startsAt: toLocalInput(slot.start, allDay),
      endsAt: toLocalInput(displayedEnd, allDay),
    })
    setError(null)
    setOpen(true)
  }
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    startTransition(async () => {
      const startsAt = values.allDay ? new Date(`${values.startsAt}T00:00:00.000Z`) : new Date(values.startsAt)
      const endsAt = values.allDay ? new Date(`${values.endsAt}T00:00:00.000Z`) : new Date(values.endsAt)
      if (values.allDay) endsAt.setUTCDate(endsAt.getUTCDate() + 1)
      const result = await createCalendarEventAction({
        ...values,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      })
      if (result.status === "error") {
        setError(result.message)
        return
      }
      if (result.status === "success" && result.data) {
        const createdEvent = result.data
        setItems((current) => [...current, createdEvent])
      }
      setOpen(false)
    })
  }

  return (
    <>
      <div className="space-y-8">
        <TechFrameCard contentClassName="px-[clamp(3rem,7vw,6rem)] py-8 sm:px-[clamp(4rem,8vw,8rem)]">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <h1 className="font-heading font-bold text-3xl text-white">Calendar</h1>
              <p className="mt-2 text-cyan-100/70">Plan workspace events and track every accessible deadline.</p>
            </div>
            <Button type="button" onClick={openDefault} disabled={initialData.workspaces.length === 0}>
              <CalendarPlus className="size-5" />
              Add event
            </Button>
          </div>
        </TechFrameCard>
        <div className="rounded-lg border border-cyan-400/30 bg-[#031326]/90 p-3 shadow-[0_0_24px_rgb(0_190_232/0.12)] sm:p-5">
          <CalendarView items={items} onSelectSlot={openForSlot} />
        </div>
        <UpcomingDeadlines items={items} />
      </div>
      <CreateEventDialog
        open={open}
        workspaces={initialData.workspaces}
        values={values}
        pending={pending}
        error={error}
        onClose={() => setOpen(false)}
        onChange={setValues}
        onSubmit={submit}
      />
    </>
  )
}
