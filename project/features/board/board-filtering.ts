import type { BoardTaskDto } from "@/features/board/board.types"

export type BoardFilterState = {
  search: string
  priority: "all" | BoardTaskDto["priority"]
  assigneeId: string
  labelIds: string[]
}

export function taskMatchesBoardFilters(task: BoardTaskDto, filters: BoardFilterState) {
  const term = filters.search.trim().toLocaleLowerCase("en-US")
  const matchesSearch =
    !term ||
    task.title.toLocaleLowerCase("en-US").includes(term) ||
    task.description?.toLocaleLowerCase("en-US").includes(term)
  const matchesPriority = filters.priority === "all" || task.priority === filters.priority
  const matchesAssignee =
    filters.assigneeId === "all" ||
    (filters.assigneeId === "unassigned" ? !task.assignee : task.assignee?.id === filters.assigneeId)
  const matchesAnyLabel =
    filters.labelIds.length === 0 || task.labels.some((label) => filters.labelIds.includes(label.id))
  return Boolean(matchesSearch && matchesPriority && matchesAssignee && matchesAnyLabel)
}

export function toggleLabelFilter(selectedIds: string[], labelId: string) {
  return selectedIds.includes(labelId) ? selectedIds.filter((id) => id !== labelId) : [...selectedIds, labelId]
}
