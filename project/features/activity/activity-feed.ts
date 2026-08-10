import type { ActivityDto } from "@/features/activity/activity.types"

function compareNewestFirst(left: ActivityDto, right: ActivityDto) {
  const timestampDifference = Date.parse(right.createdAt) - Date.parse(left.createdAt)
  if (timestampDifference !== 0) return timestampDifference
  if (left.id === right.id) return 0
  return left.id < right.id ? 1 : -1
}

export function mergeActivityItems(...pages: readonly ActivityDto[][]) {
  const uniqueItems = new Map<string, ActivityDto>()
  for (const page of pages) {
    for (const item of page) uniqueItems.set(item.id, item)
  }
  return [...uniqueItems.values()].sort(compareNewestFirst)
}
