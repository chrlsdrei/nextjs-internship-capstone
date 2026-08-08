import { describe, expect, it } from "vitest"

import { recordAiUsageSchema } from "../../features/ai/ai-usage.schema"
import { RateLimitError } from "../../features/rate-limits/rate-limit.error"
import { getRateLimitPolicy } from "../../features/rate-limits/rate-limit.policy"
import { actionError } from "../../lib/action-state"

describe("rate-limit policy", () => {
  it("defines actor and workspace limits for current and future write categories", () => {
    expect(getRateLimitPolicy("project.admin").workspace).toBeDefined()
    expect(getRateLimitPolicy("board.task.write").actor.maxRequests).toBeGreaterThan(0)
    expect(getRateLimitPolicy("board.drag").workspace?.maxRequests).toBeGreaterThan(0)
    expect(getRateLimitPolicy("label.admin").workspace).toBeDefined()
    expect(getRateLimitPolicy("label.assign").actor.maxRequests).toBeGreaterThan(0)
    expect(getRateLimitPolicy("invitation.create").workspace).toBeDefined()
    expect(getRateLimitPolicy("invitation.resend").workspace).toBeDefined()
    expect(getRateLimitPolicy("invitation.revoke").workspace).toBeDefined()
    expect(getRateLimitPolicy("comment.write").workspace).toBeDefined()
    expect(getRateLimitPolicy("attachment.write").workspace).toBeDefined()
  })

  it("preserves structured rate-limit metadata in action errors", () => {
    const error = new RateLimitError("board.drag", 17)
    expect(
      actionError(error.message, undefined, { code: error.code, retryAfterSeconds: error.retryAfterSeconds }),
    ).toEqual({
      status: "error",
      message: "Too many requests. Try again in 17 seconds.",
      code: "RATE_LIMITED",
      retryAfterSeconds: 17,
    })
  })
})

describe("AI usage accounting contract", () => {
  it("accepts reusable quota keys without requiring an AI provider", () => {
    const input = recordAiUsageSchema.parse({
      workspaceId: "0a8d93bb-5b19-41f6-8357-112b434c6ce7",
      quotaKey: "future_custom_quota",
      action: "task_drafting",
      tokensUsed: 42,
    })
    expect(input).toMatchObject({ quotaKey: "future_custom_quota", tokensUsed: 42 })
  })

  it("rejects negative token accounting", () => {
    expect(
      recordAiUsageSchema.safeParse({
        workspaceId: "0a8d93bb-5b19-41f6-8357-112b434c6ce7",
        quotaKey: "task_drafting",
        action: "draft",
        tokensUsed: -1,
      }).success,
    ).toBe(false)
  })
})
