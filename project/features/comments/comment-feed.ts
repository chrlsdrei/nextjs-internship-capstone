import type { TaskCommentDto } from "@/features/comments/comment.types"

function compareNewestFirst(left: TaskCommentDto, right: TaskCommentDto) {
  const timestampDifference = Date.parse(right.createdAt) - Date.parse(left.createdAt)
  if (timestampDifference !== 0) return timestampDifference
  if (left.id === right.id) return 0
  return left.id < right.id ? 1 : -1
}

export function mergeTaskComments(...pages: readonly TaskCommentDto[][]) {
  const comments = new Map<string, TaskCommentDto>()
  for (const page of pages) {
    for (const comment of page) comments.set(comment.id, comment)
  }
  return [...comments.values()].sort(compareNewestFirst)
}

export function replaceTaskComment(comments: TaskCommentDto[], replacement: TaskCommentDto) {
  return mergeTaskComments(
    comments.filter((comment) => comment.id !== replacement.id),
    [replacement],
  )
}
