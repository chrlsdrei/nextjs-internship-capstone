import "server-only"

import { recordAiUsageSchema } from "@/features/ai/ai-usage.schema"
import type { AiUsageDto } from "@/features/ai/ai-usage.types"
import { insertAiUsage } from "@/features/ai/server/ai-usage.repository"
import { getCurrentDatabaseUser } from "@/features/auth/server/session.service"
import { findActiveWorkspaceAccess } from "@/features/workspaces/server/workspace.repository"

export async function recordAiUsage(input: unknown): Promise<AiUsageDto> {
  const values = recordAiUsageSchema.parse(input)
  const actor = await getCurrentDatabaseUser()
  const workspace = await findActiveWorkspaceAccess(values.workspaceId, actor.id)
  if (workspace?.status !== "active") throw new Error("AI usage requires an active workspace membership")

  const usage = await insertAiUsage(actor.id, values)
  if (!usage) throw new Error("Unable to record AI usage")
  return { ...usage, createdAt: usage.createdAt.toISOString() }
}
