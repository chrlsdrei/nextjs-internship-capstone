import "server-only"

import { activityEventSchema, activityPageSchema, createActivitySchema } from "@/features/activity/activity.schema"
import type { ActivityPageDto } from "@/features/activity/activity.types"
import { insertActivityRecord, listProjectActivityRecords } from "@/features/activity/server/activity.repository"
import { requireProjectPermission } from "@/features/projects/server/project-access.service"

export async function recordActivity(input: unknown) {
  const values = createActivitySchema.parse(input)
  const activity = await insertActivityRecord(values)
  if (!activity) throw new Error("Activity references do not belong to the same workspace")
  return activity
}

export async function listProjectActivity(input: unknown): Promise<ActivityPageDto> {
  const values = activityPageSchema.parse(input)
  await requireProjectPermission(values.projectId, "manage")
  const rows = await listProjectActivityRecords(values)
  const hasNextPage = rows.length > values.limit
  const pageRows = hasNextPage ? rows.slice(0, values.limit) : rows
  const last = pageRows.at(-1)
  return {
    items: pageRows.map((row) => ({
      id: row.id,
      workspaceId: row.workspaceId,
      projectId: row.projectId,
      taskId: row.taskId,
      actorWorkspaceMemberId: row.actorWorkspaceMemberId,
      action: activityEventSchema.parse({ action: row.action, metadata: row.metadata }).action,
      schemaVersion: 1,
      metadata: activityEventSchema.parse({ action: row.action, metadata: row.metadata }).metadata,
      createdAt: row.createdAt.toISOString(),
    })),
    nextCursor: hasNextPage && last ? { createdAt: last.createdAt.toISOString(), id: last.id } : null,
  }
}
