import "server-only"

import type { RecordAiUsageInput } from "@/features/ai/ai-usage.schema"
import { db } from "@/server/db/client"
import { aiUsageLogs } from "@/server/db/schema"

export async function insertAiUsage(userId: string, input: RecordAiUsageInput) {
  const [usage] = await db
    .insert(aiUsageLogs)
    .values({
      workspaceId: input.workspaceId,
      userId,
      projectId: input.projectId ?? null,
      quotaKey: input.quotaKey,
      action: input.action,
      model: input.model ?? null,
      tokensUsed: input.tokensUsed,
    })
    .returning()
  return usage ?? null
}
