import type { ActivityEvent } from "@/features/activity/activity.schema"

type ActivityDtoBase = {
  id: string
  workspaceId: string
  projectId: string | null
  taskId: string | null
  actorWorkspaceMemberId: string | null
  createdAt: string
}

export type ActivityDto = ActivityDtoBase &
  (
    | {
        kind: "known"
        schemaVersion: 1
        event: ActivityEvent
      }
    | {
        kind: "unknown"
        schemaVersion: number
        event: { action: string; metadata: unknown }
      }
  )

export type ActivityCursorDto = { createdAt: string; id: string }

export type ActivityPageDto = {
  items: ActivityDto[]
  nextCursor: ActivityCursorDto | null
}
