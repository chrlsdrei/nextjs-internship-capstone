import { describe, expect, it } from "vitest"

import {
  buildNotificationActionUrl,
  buildNotificationEmail,
} from "../../features/notifications/gateways/notification-email.template"

describe("notification emails", () => {
  it("keeps notification actions on the configured application origin", () => {
    expect(buildNotificationActionUrl("https://questboard.example/settings", "/projects/project-id")).toBe(
      "https://questboard.example/projects/project-id",
    )
    expect(buildNotificationActionUrl("https://questboard.example", "https://malicious.example")).toBe(
      "https://questboard.example/dashboard",
    )
  })

  it("renders escaped notification content and preference guidance", () => {
    const email = buildNotificationEmail({
      recipientName: "Charles",
      type: "task_comment",
      title: "New <comment>",
      message: "Review A & B",
      actionUrl: "https://questboard.example/projects/1",
      createdAt: new Date("2026-08-22T00:00:00.000Z"),
    })

    expect(email.subject).toBe("[QuestBoard] New <comment>")
    expect(email.text).toContain("Account settings")
    expect(email.html).toContain("New &lt;comment&gt;")
    expect(email.html).toContain("Review A &amp; B")
    expect(email.html).not.toContain("New <comment>")
  })
})
