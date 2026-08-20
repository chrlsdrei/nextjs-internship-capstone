import "server-only"

import { and, eq, sql } from "drizzle-orm"

import { db } from "@/server/db/client"
import { aiUsageLogs } from "@/server/db/schema"

export async function reserveAiUsage(input: {
  workspaceId: string
  userId: string
  projectId?: string | null
  quotaKey: string
  action: string
  requestKey: string
  model: string
  limit: number | null
  scope: "user" | "workspace"
  periodStartsAt: Date
  periodEndsAt: Date
}) {
  if (input.limit === null) {
    const inserted = await db.execute<{
      reservation_id: string
      reservation_status: "pending" | "succeeded" | "failed"
      reservation_result_resource_id: string | null
    }>(sql`
      INSERT INTO "ai_usage_logs" (
        "workspace_id", "user_id", "project_id", "quota_key", "action", "request_key", "status",
        "model", "period_starts_at", "period_ends_at"
      ) VALUES (
        ${input.workspaceId}, ${input.userId}, ${input.projectId ?? null}, ${input.quotaKey}, ${input.action},
        ${input.requestKey}, 'pending', ${input.model}, ${input.periodStartsAt}, ${input.periodEndsAt}
      )
      ON CONFLICT ("user_id", "request_key") DO NOTHING
      RETURNING "id" AS "reservation_id", "status" AS "reservation_status",
        "result_resource_id" AS "reservation_result_resource_id"
    `)
    const created = inserted.rows[0]
    if (created) {
      return {
        reservation: {
          id: created.reservation_id,
          status: created.reservation_status,
          result_resource_id: created.reservation_result_resource_id,
        },
        existing: false,
      }
    }
    const [existing] = await db
      .select({
        id: aiUsageLogs.id,
        status: aiUsageLogs.status,
        resultResourceId: aiUsageLogs.resultResourceId,
      })
      .from(aiUsageLogs)
      .where(and(eq(aiUsageLogs.userId, input.userId), eq(aiUsageLogs.requestKey, input.requestKey)))
      .limit(1)
    if (!existing) return null
    return {
      reservation: {
        id: existing.id,
        status: existing.status,
        result_resource_id: existing.resultResourceId,
      },
      existing: true,
    }
  }
  const result = await db.execute<{
    reservation_id: string
    reservation_status: "pending" | "succeeded" | "failed"
    reservation_result_resource_id: string | null
    reservation_existing: boolean
  }>(sql`
    SELECT * FROM "public"."reserve_ai_usage"(
      ${input.workspaceId}, ${input.userId}, ${input.projectId ?? null}, ${input.quotaKey}, ${input.action},
      ${input.requestKey}, ${input.model}, ${input.limit}, ${input.scope}, ${input.periodStartsAt}, ${input.periodEndsAt}
    )
  `)
  const row = result.rows[0]
  if (!row) return null
  return {
    reservation: {
      id: row.reservation_id,
      status: row.reservation_status,
      result_resource_id: row.reservation_result_resource_id,
    },
    existing: row.reservation_existing,
  }
}

export async function succeedAiUsage(input: {
  id: string
  providerRequestId: string | null
  resultResourceId: string
  inputTokens: number
  outputTokens: number
}) {
  const [usage] = await db
    .update(aiUsageLogs)
    .set({
      status: "succeeded",
      providerRequestId: input.providerRequestId,
      resultResourceId: input.resultResourceId,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      tokensUsed: input.inputTokens + input.outputTokens,
      errorCode: null,
      updatedAt: new Date(),
    })
    .where(and(eq(aiUsageLogs.id, input.id), eq(aiUsageLogs.status, "pending")))
    .returning()
  return usage ?? null
}

export async function failAiUsage(id: string, errorCode: string) {
  await db
    .update(aiUsageLogs)
    .set({ status: "failed", errorCode, updatedAt: new Date() })
    .where(and(eq(aiUsageLogs.id, id), eq(aiUsageLogs.status, "pending")))
}
