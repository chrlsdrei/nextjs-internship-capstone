import { describe, expect, it } from "vitest"

import { activityEventSchema, createActivitySchema } from "../../features/activity/activity.schema"

describe("activity metadata contracts", () => {
  it("accepts version-one events with safe display snapshots", () => {
    expect(
      createActivitySchema.parse({
        workspaceId: "0a8d93bb-5b19-41f6-8357-112b434c6ce7",
        projectId: "c6e0f983-fb1e-4363-8c1b-4f32f5773313",
        actorWorkspaceMemberId: "a1360ac9-fc79-486d-89e8-4600c817470c",
        event: {
          action: "task.deleted",
          metadata: {
            actorName: "Charles",
            workspaceName: "Product",
            projectTitle: "MVP",
            taskTitle: "Build login",
          },
        },
      }).event.action,
    ).toBe("task.deleted")
  })

  it("rejects missing snapshots and metadata for the wrong action", () => {
    expect(
      activityEventSchema.safeParse({
        action: "task.deleted",
        metadata: { actorName: "Charles", workspaceName: "Product", projectTitle: "MVP" },
      }).success,
    ).toBe(false)
    expect(
      activityEventSchema.safeParse({
        action: "workspace.created",
        metadata: { actorName: "Charles", workspaceName: "Product", taskTitle: "Unexpected" },
      }).success,
    ).toBe(false)
  })

  it("rejects unknown action keys until a versioned contract is added", () => {
    expect(activityEventSchema.safeParse({ action: "project.unknown", metadata: {} }).success).toBe(false)
  })

  it("validates assignment-history snapshots", () => {
    expect(
      activityEventSchema.safeParse({
        action: "task.assignees_updated",
        metadata: {
          actorName: "Charles",
          workspaceName: "Product",
          projectTitle: "MVP",
          taskTitle: "Build login",
          assigneeNames: ["Ada", "Grace"],
        },
      }).success,
    ).toBe(true)
  })
})
