import type { RateLimitAction } from "@/features/rate-limits/rate-limit.types"

export class RateLimitError extends Error {
  readonly code = "RATE_LIMITED" as const

  constructor(
    readonly action: RateLimitAction,
    readonly retryAfterSeconds: number,
  ) {
    super(`Too many requests. Try again in ${retryAfterSeconds} seconds.`)
    this.name = "RateLimitError"
  }
}
