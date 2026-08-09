import { describe, expect, it } from "vitest"

import { changeTaskAssigneeSchema, setTaskAssigneesSchema, taskSchema } from "../../features/board/board.schema"

const projectId = "00000000-0000-4000-8000-000000000001"
const taskId = "00000000-0000-4000-8000-000000000002"
const firstMemberId = "00000000-0000-4000-8000-000000000003"
const secondMemberId = "00000000-0000-4000-8000-000000000004"

describe("task assignment validation", () => {
  it("accepts zero, one, or many unique project-member IDs", () => {
    expect(setTaskAssigneesSchema.parse({ projectId, taskId, projectMemberIds: [] }).projectMemberIds).toEqual([])
    expect(
      setTaskAssigneesSchema.parse({ projectId, taskId, projectMemberIds: [firstMemberId, secondMemberId] })
        .projectMemberIds,
    ).toEqual([firstMemberId, secondMemberId])
  })

  it("rejects duplicate and malformed project-member IDs", () => {
    expect(
      setTaskAssigneesSchema.safeParse({ projectId, taskId, projectMemberIds: [firstMemberId, firstMemberId] }).success,
    ).toBe(false)
    expect(changeTaskAssigneeSchema.safeParse({ projectId, taskId, projectMemberId: "not-a-uuid" }).success).toBe(false)
  })

  it("uses an empty assignment set when a task is created without assignees", () => {
    const result = taskSchema.parse({
      title: "Unassigned task",
      listId: "00000000-0000-4000-8000-000000000005",
    })
    expect(result.assigneeIds).toEqual([])
  })
})
