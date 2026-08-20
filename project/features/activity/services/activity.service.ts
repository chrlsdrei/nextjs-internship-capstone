import "server-only"

import { activityEventSchema, activityPageSchema, createActivitySchema } from "@/features/activity/activity.schema"
import type { ActivityPageDto } from "@/features/activity/activity.types"
import { insertActivityRecord, listProjectActivityRecords } from "@/features/activity/repositories/activity.repository"
import { requireProjectPermission } from "@/features/projects/services/project-access.service"

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
    items: pageRows.map((row) => {
      const event =
        row.schemaVersion === 1 ? activityEventSchema.safeParse({ action: row.action, metadata: row.metadata }) : null
      const base = {
        id: row.id,
        workspaceId: row.workspaceId,
        projectId: row.projectId,
        taskId: row.taskId,
        actorWorkspaceMemberId: row.actorWorkspaceMemberId,
        createdAt: row.createdAt.toISOString(),
      }
      return event?.success
        ? ({ ...base, kind: "known", schemaVersion: 1, event: event.data } as const)
        : ({
            ...base,
            kind: "unknown",
            schemaVersion: row.schemaVersion,
            event: { action: row.action, metadata: row.metadata },
          } as const)
    }),
    nextCursor: hasNextPage && last ? { createdAt: last.createdAt.toISOString(), id: last.id } : null,
  }
}
