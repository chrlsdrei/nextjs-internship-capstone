import { describe, expect, it } from "vitest"

import { getPresenceLabel } from "@/components/team/presence-label"

const now = new Date("2026-08-25T12:00:00.000Z")

describe("getPresenceLabel", () => {
  it("treats a recent heartbeat as online", () => {
    expect(getPresenceLabel("2026-08-25T11:58:30.000Z", now)).toEqual({ isOnline: true, label: "Online" })
  })

  it("formats offline minutes, hours, and days", () => {
    expect(getPresenceLabel("2026-08-25T11:03:00.000Z", now).label).toBe("Offline 57 minutes ago")
    expect(getPresenceLabel("2026-08-25T08:00:00.000Z", now).label).toBe("Offline 4 hours ago")
    expect(getPresenceLabel("2026-08-23T12:00:00.000Z", now).label).toBe("Offline 2 days ago")
  })

  it("handles users without a heartbeat", () => {
    expect(getPresenceLabel(null, now)).toEqual({ isOnline: false, label: "Not seen online yet" })
  })
})
