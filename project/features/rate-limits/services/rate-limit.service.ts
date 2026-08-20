import "server-only"

import { RateLimitError } from "@/features/rate-limits/rate-limit.error"
import { getRateLimitPolicy } from "@/features/rate-limits/rate-limit.policy"
import type { RateLimitAction, RateLimitRequirement, RateLimitResult } from "@/features/rate-limits/rate-limit.types"
import { consumeRateLimitBuckets } from "@/features/rate-limits/repositories/rate-limit.repository"

type EnforceRateLimitInput = {
  action: RateLimitAction
  actorUserId: string
  workspaceId?: string
}

function requirementsFor(input: EnforceRateLimitInput): RateLimitRequirement[] {
  const policy = getRateLimitPolicy(input.action)
  const requirements: RateLimitRequirement[] = [
    {
      ...policy.actor,
      scope: "actor",
      scopeKey: input.actorUserId,
      actorUserId: input.actorUserId,
      workspaceId: null,
    },
  ]

  if (policy.workspace) {
    if (!input.workspaceId) throw new Error(`Rate-limit action ${input.action} requires a workspace`)
    requirements.push({
      ...policy.workspace,
      scope: "workspace",
      scopeKey: input.workspaceId,
      actorUserId: null,
      workspaceId: input.workspaceId,
    })
  }
  return requirements
}

export async function checkRateLimit(input: EnforceRateLimitInput): Promise<RateLimitResult> {
  const result = await consumeRateLimitBuckets(input.action, requirementsFor(input))
  return {
    action: input.action,
    allowed: result.allowed,
    remaining: result.remaining,
    retryAfterSeconds: result.retryAfterSeconds,
    resetAt: new Date(result.resetAt).toISOString(),
  }
}

export async function enforceRateLimit(input: EnforceRateLimitInput): Promise<RateLimitResult> {
  const result = await checkRateLimit(input)
  if (!result.allowed) throw new RateLimitError(result.action, result.retryAfterSeconds)
  return result
}
