"use client"

import { useEffect, useMemo, useState } from "react"

import type { BoardTaskDto, ProjectBoardDto } from "@/features/board/board.types"
import { retainActiveMemberSelections, taskMatchesBoardFilters } from "@/features/board/board-filtering"

export function useBoardFilters(board: ProjectBoardDto) {
  const [search, setSearch] = useState("")
  const [priority, setPriority] = useState<"all" | BoardTaskDto["priority"]>("all")
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([])
  const [includeUnassigned, setIncludeUnassigned] = useState(false)
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([])

  useEffect(() => {
    const availableIds = new Set(board.labels.map((label) => label.id))
    setSelectedLabelIds((current) => current.filter((id) => availableIds.has(id)))
  }, [board.labels])

  useEffect(() => {
    setSelectedAssigneeIds((current) => retainActiveMemberSelections(current, board.members))
  }, [board.members])

  const visibleLists = useMemo(
    () =>
      board.lists.map((list) => ({
        ...list,
        tasks: list.tasks.filter((task) =>
          taskMatchesBoardFilters(task, {
            search,
            priority,
            assigneeIds: selectedAssigneeIds,
            includeUnassigned,
            labelIds: selectedLabelIds,
          }),
        ),
      })),
    [board.lists, includeUnassigned, priority, search, selectedAssigneeIds, selectedLabelIds],
  )

  return {
    search,
    setSearch,
    priority,
    setPriority,
    selectedAssigneeIds,
    setSelectedAssigneeIds,
    includeUnassigned,
    setIncludeUnassigned,
    selectedLabelIds,
    setSelectedLabelIds,
    visibleLists,
    activeFilterCount:
      (priority === "all" ? 0 : 1) + selectedAssigneeIds.length + (includeUnassigned ? 1 : 0) + selectedLabelIds.length,
  }
}
