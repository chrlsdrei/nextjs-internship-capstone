"use client"

import { Building2, CalendarPlus, LoaderCircle } from "lucide-react"
import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import type { CalendarWorkspaceDto } from "@/features/calendar/calendar.types"

export type CalendarEventForm = {
  workspaceId: string
  title: string
  description: string
  allDay: boolean
  startsAt: string
  endsAt: string
}

type CreateEventDialogProps = {
  open: boolean
  workspace: CalendarWorkspaceDto | undefined
  values: CalendarEventForm
  pending: boolean
  error: string | null
  onClose: () => void
  onChange: (values: CalendarEventForm) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function CreateEventDialog({
  open,
  workspace,
  values,
  pending,
  error,
  onClose,
  onChange,
  onSubmit,
}: CreateEventDialogProps) {
  const dateType = values.allDay ? "date" : "datetime-local"
  const toggleAllDay = (allDay: boolean) => {
    if (allDay) {
      onChange({ ...values, allDay, startsAt: values.startsAt.slice(0, 10), endsAt: values.endsAt.slice(0, 10) })
      return
    }
    onChange({
      ...values,
      allDay,
      startsAt: `${values.startsAt.slice(0, 10)}T09:00`,
      endsAt: `${values.endsAt.slice(0, 10)}T10:00`,
    })
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add calendar event"
      description="Schedule a workspace event alongside project and task deadlines."
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="create-calendar-event" disabled={pending || !workspace}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : <CalendarPlus className="size-4" />}
            Add event
          </Button>
        </div>
      }
    >
      <form id="create-calendar-event" className="space-y-4 px-1" onSubmit={onSubmit}>
        <input type="hidden" name="workspaceId" value={workspace?.id ?? ""} />
        <div className="flex items-center gap-3 rounded-md border border-cyan-400/20 bg-cyan-950/25 p-3">
          <Building2 className="shrink-0 text-cyan-300" size={18} />
          <div className="min-w-0">
            <p className="text-cyan-100/55 text-xs uppercase tracking-wider">Active workspace</p>
            <p className="truncate font-semibold text-cyan-50">{workspace?.name ?? "No workspace selected"}</p>
          </div>
        </div>
        <label htmlFor="calendar-event-title" className="grid gap-2 font-medium text-sm">
          Event title
          <Input
            id="calendar-event-title"
            required
            maxLength={120}
            value={values.title}
            onChange={(event) => onChange({ ...values, title: event.target.value })}
            placeholder="e.g. Sprint planning"
            className="h-10 bg-[#041426]"
          />
        </label>
        <label htmlFor="calendar-event-description" className="grid gap-2 font-medium text-sm">
          Description <span className="sr-only">optional</span>
          <textarea
            id="calendar-event-description"
            maxLength={1000}
            rows={3}
            value={values.description}
            onChange={(event) => onChange({ ...values, description: event.target.value })}
            placeholder="Optional event details"
            className="resize-y rounded-md border border-cyan-400/45 bg-[#041426] px-3 py-2 text-cyan-50 outline-none placeholder:text-cyan-100/40 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/25"
          />
        </label>
        <label className="flex items-center gap-3 rounded-md border border-cyan-400/20 bg-cyan-950/25 p-3 font-medium text-sm">
          <input
            type="checkbox"
            checked={values.allDay}
            onChange={(event) => toggleAllDay(event.target.checked)}
            className="size-4 accent-cyan-400"
          />
          All-day event
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label htmlFor="calendar-event-start" className="grid gap-2 font-medium text-sm">
            Starts
            <Input
              id="calendar-event-start"
              required
              type={dateType}
              value={values.startsAt}
              onChange={(event) => onChange({ ...values, startsAt: event.target.value })}
              className="h-10 bg-[#041426] [color-scheme:dark]"
            />
          </label>
          <label htmlFor="calendar-event-end" className="grid gap-2 font-medium text-sm">
            Ends
            <Input
              id="calendar-event-end"
              required
              type={dateType}
              value={values.endsAt}
              onChange={(event) => onChange({ ...values, endsAt: event.target.value })}
              className="h-10 bg-[#041426] [color-scheme:dark]"
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="rounded-md border border-red-400/40 bg-red-950/45 px-3 py-2 text-red-100 text-sm">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}
