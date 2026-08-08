import type { ActivityEvent } from "@/features/activity/activity.schema"

export type ActivityDto = {
  id: string
  workspaceId: string
  projectId: string | null
  taskId: string | null
  actorWorkspaceMemberId: string | null
  action: ActivityEvent["action"]
  schemaVersion: 1
  metadata: ActivityEvent["metadata"]
  createdAt: string
}

export type ActivityPageDto = {
  items: ActivityDto[]
  nextCursor: { createdAt: string; id: string } | null
}
