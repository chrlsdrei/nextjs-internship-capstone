import { describe, expect, it } from "vitest"

import { calendarDisplayDate } from "../../components/calendar/calendar-view"

describe("calendar display dates", () => {
  it("keeps all-day values on their stored calendar date at local midnight", () => {
    const result = calendarDisplayDate("2026-08-19T00:00:00.000Z", true)

    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(7)
    expect(result.getDate()).toBe(19)
    expect(result.getHours()).toBe(0)
  })

  it("preserves exact timestamps for timed events", () => {
    const value = "2026-08-19T03:30:00.000Z"

    expect(calendarDisplayDate(value, false).toISOString()).toBe(value)
  })
})
