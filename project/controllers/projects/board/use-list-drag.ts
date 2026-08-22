"use client"

import type { UniqueIdentifier } from "@dnd-kit/core"
import { useRef, useState } from "react"

import { useBoardStore } from "@/controllers/projects/board/board.store"
import { reorderListsCommandAction } from "@/features/board/actions/reorder-lists-command"
import type { ProjectBoardDto } from "@/features/board/board.types"

function sortableListId(value: UniqueIdentifier) {
  const id = String(value)
  return id.startsWith("list-sort:") ? id.slice("list-sort:".length) : null
}

function targetListId(board: ProjectBoardDto, value: UniqueIdentifier) {
  const id = String(value)
  if (id.startsWith("list-sort:")) return id.slice("list-sort:".length)
  if (id.startsWith("list:")) return id.slice("list:".length)
  return board.lists.find((list) => list.tasks.some((task) => task.id === id))?.id ?? null
}

export function useListDrag(projectId: string, board: ProjectBoardDto) {
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const initialBoard = useRef<ProjectBoardDto | null>(null)
  const reorderListsOptimistically = useBoardStore((state) => state.reorderListsOptimistically)
  const restoreBoard = useBoardStore((state) => state.restoreBoard)
  const setSaving = useBoardStore((state) => state.setSaving)
  const setError = useBoardStore((state) => state.setError)

  function begin(value: UniqueIdentifier) {
    const listId = sortableListId(value)
    if (!listId) return false
    initialBoard.current = board
    setActiveListId(listId)
    setError(null)
    return true
  }

  function preview(active: UniqueIdentifier, over: UniqueIdentifier) {
    const sourceId = sortableListId(active)
    const destinationId = targetListId(board, over)
    if (!sourceId || !destinationId) return false
    reorderListsOptimistically(projectId, board, sourceId, destinationId)
    return true
  }

  async function commit(active: UniqueIdentifier, over?: UniqueIdentifier) {
    const snapshot = initialBoard.current
    if (!snapshot || !sortableListId(active)) return false
    if (over) preview(active, over)
    const current = useBoardStore.getState().board
    setActiveListId(null)
    initialBoard.current = null
    if (!current) return true

    setSaving(true)
    const result = await reorderListsCommandAction({
      projectId,
      listIds: current.lists.map((list) => list.id),
    })
    if (result.status === "error") {
      restoreBoard(projectId, snapshot)
      setError(result.message)
    }
    setSaving(false)
    return true
  }

  function cancel() {
    if (!initialBoard.current) return false
    restoreBoard(projectId, initialBoard.current)
    initialBoard.current = null
    setActiveListId(null)
    return true
  }

  return {
    activeListId,
    beginListDrag: begin,
    previewListDrag: preview,
    commitListDrag: commit,
    cancelListDrag: cancel,
  }
}
