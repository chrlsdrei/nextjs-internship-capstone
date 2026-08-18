import { describe, expect, it } from "vitest"

import { createCalendarEventSchema } from "../../features/calendar/calendar.schema"

const validEvent = {
  workspaceId: "0a8d93bb-5b19-41f6-8357-112b434c6ce7",
  title: "Sprint planning",
  description: "Review the next sprint.",
  startsAt: "2026-08-18T09:00:00.000Z",
  endsAt: "2026-08-18T10:00:00.000Z",
  allDay: false,
}

describe("calendar event validation", () => {
  it("normalizes a valid event", () => {
    const event = createCalendarEventSchema.parse(validEvent)
    expect(event.title).toBe("Sprint planning")
    expect(event.startsAt).toBeInstanceOf(Date)
  })

  it("rejects an end time that is not after the start", () => {
    const result = createCalendarEventSchema.safeParse({ ...validEvent, endsAt: validEvent.startsAt })
    expect(result.success).toBe(false)
  })

  it("rejects excessively long events and titles", () => {
    expect(
      createCalendarEventSchema.safeParse({
        ...validEvent,
        title: "x".repeat(121),
        endsAt: "2028-08-18T10:00:00.000Z",
      }).success,
    ).toBe(false)
  })
})
