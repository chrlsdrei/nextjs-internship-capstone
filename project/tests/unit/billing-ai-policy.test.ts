import { describe, expect, it } from "vitest"

import {
  generateBoardSchema,
  generatedBoardSchema,
  generateSummarySchema,
  generateTasksSchema,
} from "@/features/ai/ai-usage.schema"
import { tierGrantsAccess } from "@/features/billing/billing.policy"

describe("subscription entitlements", () => {
  it("grants Pro access only before the stored expiration", () => {
    const now = new Date("2026-08-18T00:00:00.000Z")
    expect(tierGrantsAccess("pro", new Date("2026-09-17T00:00:00.000Z"), now)).toBe(true)
    expect(tierGrantsAccess("pro", new Date("2026-08-17T00:00:00.000Z"), now)).toBe(false)
    expect(tierGrantsAccess("free", new Date("2026-09-17T00:00:00.000Z"), now)).toBe(false)
  })
})

describe("AI boundaries", () => {
  const requestKey = "1234567890abcdef"

  it("limits generated boards to three lists and fifteen tasks", () => {
    expect(
      generateBoardSchema.safeParse({
        workspaceId: crypto.randomUUID(),
        title: "Launch",
        goal: "Plan a product launch in practical stages",
        listCount: 4,
        taskCount: 16,
        idempotencyKey: requestKey,
      }).success,
    ).toBe(false)
  })

  it("limits task generation to five tasks", () => {
    expect(
      generateTasksSchema.safeParse({
        projectId: crypto.randomUUID(),
        listId: crypto.randomUUID(),
        goal: "Prepare the release quality assurance work",
        taskCount: 6,
        idempotencyKey: requestKey,
      }).success,
    ).toBe(false)
  })

  it("requires exact structured board content", () => {
    const result = generatedBoardSchema.parse({
      lists: [{ name: "To do", tasks: [{ title: "Draft", description: "Draft the release notes" }] }],
    })
    expect(result.lists[0].tasks).toHaveLength(1)
  })

  it("rejects malformed summary identifiers", () => {
    expect(generateSummarySchema.safeParse({ projectId: "bad", idempotencyKey: requestKey }).success).toBe(false)
  })
})
