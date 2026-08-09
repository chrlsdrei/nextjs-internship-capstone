import type { BoardMemberDto, BoardTaskDto } from "@/features/board/board.types"

export type BoardFilterState = {
  search: string
  priority: "all" | BoardTaskDto["priority"]
  assigneeIds: string[]
  includeUnassigned: boolean
  labelIds: string[]
}

export function taskMatchesBoardFilters(task: BoardTaskDto, filters: BoardFilterState) {
  const term = filters.search.trim().toLocaleLowerCase("en-US")
  const matchesSearch =
    !term ||
    task.title.toLocaleLowerCase("en-US").includes(term) ||
    task.description?.toLocaleLowerCase("en-US").includes(term)
  const matchesPriority = filters.priority === "all" || task.priority === filters.priority
  const hasAssigneeFilter = filters.assigneeIds.length > 0 || filters.includeUnassigned
  const matchesAssignee =
    !hasAssigneeFilter ||
    (filters.includeUnassigned && task.assignees.length === 0) ||
    task.assignees.some((assignee) => filters.assigneeIds.includes(assignee.id))
  const matchesAnyLabel =
    filters.labelIds.length === 0 || task.labels.some((label) => filters.labelIds.includes(label.id))
  return Boolean(matchesSearch && matchesPriority && matchesAssignee && matchesAnyLabel)
}

export function toggleLabelFilter(selectedIds: string[], labelId: string) {
  return selectedIds.includes(labelId) ? selectedIds.filter((id) => id !== labelId) : [...selectedIds, labelId]
}

export const toggleAssigneeFilter = toggleLabelFilter

export function retainActiveMemberSelections(selectedIds: string[], members: BoardMemberDto[]) {
  const activeIds = new Set(members.map((member) => member.id))
  return selectedIds.filter((id) => activeIds.has(id))
}
