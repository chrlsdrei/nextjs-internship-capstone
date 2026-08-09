import { describe, expect, it } from "vitest"

import { toTaskCommentDto } from "../../features/comments/comment.mapper"
import { commentCapabilities } from "../../features/comments/comment.policy"
import {
  createTaskCommentSchema,
  taskCommentPageSchema,
  updateTaskCommentSchema,
} from "../../features/comments/comment.schema"

const actorId = "00000000-0000-4000-8000-000000000001"
const otherId = "00000000-0000-4000-8000-000000000002"
const projectId = "00000000-0000-4000-8000-000000000003"
const taskId = "00000000-0000-4000-8000-000000000004"
const commentId = "00000000-0000-4000-8000-000000000005"

describe("task comment contracts", () => {
  it("trims valid comments and rejects empty or oversized content", () => {
    expect(createTaskCommentSchema.parse({ projectId, taskId, content: "  Ship it  " }).content).toBe("Ship it")
    expect(createTaskCommentSchema.safeParse({ projectId, taskId, content: "   " }).success).toBe(false)
    expect(updateTaskCommentSchema.safeParse({ projectId, taskId, commentId, content: "x".repeat(5001) }).success).toBe(
      false,
    )
  })

  it("validates bounded cursor pagination", () => {
    expect(taskCommentPageSchema.parse({ projectId, taskId }).limit).toBe(20)
    expect(taskCommentPageSchema.safeParse({ projectId, taskId, limit: 51 }).success).toBe(false)
  })

  it("allows administrators and editors to participate while viewers remain read-only", () => {
    expect(commentCapabilities("board_admin", actorId, otherId, null)).toMatchObject({
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canModerate: true,
    })
    expect(commentCapabilities("editor", actorId, actorId, null)).toMatchObject({
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canModerate: false,
    })
    expect(commentCapabilities("editor", actorId, otherId, null)).toMatchObject({ canEdit: false, canDelete: false })
    expect(commentCapabilities("viewer", actorId, actorId, null)).toMatchObject({
      canCreate: false,
      canEdit: false,
      canDelete: false,
    })
  })

  it("maps deleted content to a tombstone contract without losing author history", () => {
    const deletedAt = new Date("2030-01-02T00:00:00.000Z")
    const dto = toTaskCommentDto(
      {
        id: commentId,
        projectId,
        taskId,
        authorWorkspaceMemberId: otherId,
        authorName: "Removed Author",
        authorEmail: "removed@example.com",
        authorRemoved: true,
        content: "Stored for audit but never returned",
        deletedAt,
        createdAt: new Date("2030-01-01T00:00:00.000Z"),
        updatedAt: deletedAt,
      },
      { role: "board_admin", workspaceMemberId: actorId },
    )
    expect(dto).toMatchObject({
      content: null,
      deletedAt: deletedAt.toISOString(),
      author: { name: "Removed Author", removed: true },
      permissions: { canEdit: false, canDelete: false },
    })
  })
})
