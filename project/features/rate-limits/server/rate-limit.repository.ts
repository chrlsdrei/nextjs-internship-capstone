import "server-only"

import { sql } from "drizzle-orm"

import type { RateLimitRequirement } from "@/features/rate-limits/rate-limit.types"
import { db } from "@/server/db/client"

type ConsumptionRow = {
  allowed: boolean
  remaining: number
  resetAt: Date | string
  retryAfterSeconds: number
}

async function consumeBucket(action: string, requirement: RateLimitRequirement) {
  const result = await db.execute<ConsumptionRow>(sql`
    WITH "clock" AS MATERIALIZED (
      SELECT clock_timestamp() AS "now"
    ),
    "window" AS MATERIALIZED (
      SELECT
        to_timestamp(
          floor(extract(epoch FROM "now") / ${requirement.windowSeconds}) * ${requirement.windowSeconds}
        ) AS "window_started_at",
        to_timestamp(
          floor(extract(epoch FROM "now") / ${requirement.windowSeconds}) * ${requirement.windowSeconds}
          + ${requirement.windowSeconds}
        ) AS "expires_at",
        "now"
      FROM "clock"
    ),
    "pruned" AS MATERIALIZED (
      DELETE FROM "rate_limit_buckets"
      WHERE "expires_at" < (SELECT "now" FROM "clock") - interval '1 day'
      RETURNING "id"
    ),
    "consumed" AS MATERIALIZED (
      INSERT INTO "rate_limit_buckets" (
        "scope",
        "scope_key",
        "actor_user_id",
        "workspace_id",
        "action",
        "window_started_at",
        "expires_at",
        "request_count"
      )
      SELECT
        ${requirement.scope}::rate_limit_scope,
        ${requirement.scopeKey}::uuid,
        ${requirement.actorUserId}::uuid,
        ${requirement.workspaceId}::uuid,
        ${action},
        "window_started_at",
        "expires_at",
        1
      FROM "window"
      CROSS JOIN (SELECT count(*) FROM "pruned") AS "prune_barrier"
      ON CONFLICT ("scope", "scope_key", "action", "window_started_at")
      DO UPDATE SET
        "request_count" = "rate_limit_buckets"."request_count" + 1,
        "expires_at" = EXCLUDED."expires_at",
        "updated_at" = NOW()
      WHERE "rate_limit_buckets"."request_count" < ${requirement.maxRequests}
      RETURNING "request_count"
    )
    SELECT
      EXISTS(SELECT 1 FROM "consumed") AS "allowed",
      COALESCE(
        (SELECT GREATEST(0, ${requirement.maxRequests} - "request_count")::integer FROM "consumed"),
        0
      ) AS "remaining",
      "window"."expires_at" AS "resetAt",
      CASE
        WHEN EXISTS(SELECT 1 FROM "consumed") THEN 0
        ELSE GREATEST(1, CEIL(extract(epoch FROM ("window"."expires_at" - "window"."now"))))::integer
      END AS "retryAfterSeconds"
    FROM "window"
  `)

  const row = result.rows[0]
  if (!row) throw new Error("Rate-limit consumption returned no result")
  return row
}

export async function consumeRateLimitBuckets(action: string, requirements: RateLimitRequirement[]) {
  if (requirements.length === 0) throw new Error("At least one rate-limit requirement is required")

  const orderedRequirements = [...requirements].sort((left, right) => {
    if (left.scope === right.scope) return left.scopeKey.localeCompare(right.scopeKey)
    // Stop actor-level abuse before it can consume shared workspace capacity.
    return left.scope === "actor" ? -1 : 1
  })
  const results: ConsumptionRow[] = []

  for (const requirement of orderedRequirements) {
    const result = await consumeBucket(action, requirement)
    results.push(result)
    if (!result.allowed) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: result.resetAt,
        retryAfterSeconds: result.retryAfterSeconds,
      }
    }
  }

  return {
    allowed: true,
    remaining: Math.min(...results.map((result) => result.remaining)),
    resetAt: results.reduce(
      (latest, result) => (new Date(result.resetAt) > new Date(latest) ? result.resetAt : latest),
      results[0].resetAt,
    ),
    retryAfterSeconds: 0,
  }
}
