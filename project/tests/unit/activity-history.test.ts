import { describe, expect, it } from "vitest"
import { describeActivity } from "../../features/activity/activity.presenter"
import type { ActivityDto } from "../../features/activity/activity.types"
import { mergeActivityItems } from "../../features/activity/activity-feed"

const base = {
  workspaceId: "00000000-0000-4000-8000-000000000001",
  projectId: "00000000-0000-4000-8000-000000000002",
  taskId: null,
  actorWorkspaceMemberId: "00000000-0000-4000-8000-000000000003",
}

function knownActivity(id: string, createdAt: string, title: string): ActivityDto {
  return {
    ...base,
    id,
    createdAt,
    kind: "known",
    schemaVersion: 1,
    event: {
      action: "project.updated",
      metadata: {
        actorName: "Ada Lovelace",
        workspaceName: "Engineering",
        projectTitle: title,
      },
    },
  }
}

describe("activity presentation", () => {
  it("renders a validated event through its typed description", () => {
    expect(
      describeActivity(knownActivity("00000000-0000-4000-8000-000000000004", "2030-01-01T00:00:00Z", "Launch")),
    ).toEqual({
      title: "Ada Lovelace updated the project",
      detail: "Launch",
    })
  })

  it("renders an unknown future version without exposing unvalidated metadata", () => {
    const activity: ActivityDto = {
      ...base,
      id: "00000000-0000-4000-8000-000000000005",
      createdAt: "2030-01-01T00:00:00Z",
      kind: "unknown",
      schemaVersion: 4,
      event: { action: "future.private_event", metadata: { secret: "do not render" } },
    }
    expect(describeActivity(activity)).toEqual({
      title: "Project activity was updated",
      detail: "Unsupported activity version 4",
    })
  })
})

describe("activity page merging", () => {
  it("deduplicates realtime/page overlap and keeps deterministic newest-first order", () => {
    const older = knownActivity("00000000-0000-4000-8000-000000000004", "2030-01-01T00:00:00Z", "Older")
    const newer = knownActivity("00000000-0000-4000-8000-000000000005", "2030-01-02T00:00:00Z", "Newer")
    expect(mergeActivityItems([older, newer], [newer])).toEqual([newer, older])
  })
})
