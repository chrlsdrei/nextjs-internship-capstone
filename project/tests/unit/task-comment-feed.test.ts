import { describe, expect, it } from "vitest"

import type { TaskCommentDto } from "@/features/comments/comment.types"
import { mergeTaskComments, replaceTaskComment } from "@/features/comments/comment-feed"

function comment(id: string, createdAt: string, overrides: Partial<TaskCommentDto> = {}): TaskCommentDto {
  return {
    id,
    projectId: "00000000-0000-4000-8000-000000000001",
    taskId: "00000000-0000-4000-8000-000000000002",
    content: `Comment ${id}`,
    author: {
      workspaceMemberId: "00000000-0000-4000-8000-000000000003",
      name: "Commenter",
      email: "commenter@example.com",
      removed: false,
    },
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    permissions: { canEdit: true, canDelete: true, canModerate: false },
    ...overrides,
  }
}

describe("task comment feed", () => {
  it("merges overlapping pages without duplicates in newest-first order", () => {
    const older = comment("00000000-0000-4000-8000-000000000011", "2026-08-08T08:00:00.000Z")
    const newer = comment("00000000-0000-4000-8000-000000000012", "2026-08-09T08:00:00.000Z")

    expect(mergeTaskComments([newer], [newer, older]).map((item) => item.id)).toEqual([newer.id, older.id])
  })

  it("replaces a comment with its edited or deleted representation", () => {
    const original = comment("00000000-0000-4000-8000-000000000013", "2026-08-09T08:00:00.000Z")
    const tombstone = { ...original, content: null, deletedAt: "2026-08-09T09:00:00.000Z" }

    expect(replaceTaskComment([original], tombstone)).toEqual([tombstone])
  })
})
