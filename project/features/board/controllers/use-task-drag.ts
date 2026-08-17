"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"

import { moveTaskCommandAction, reorderTasksCommandAction } from "@/features/board/actions/board.actions"
import type { ProjectBoardDto } from "@/features/board/board.types"
import { useBoardStore } from "@/features/board/stores/board.store"

function taskLocation(board: ProjectBoardDto, taskId: string) {
  const list = board.lists.find((candidate) => candidate.tasks.some((task) => task.id === taskId))
  if (!list) return null
  const index = list.tasks.findIndex((task) => task.id === taskId)
  return { list, index }
}

function taskOrder(board: ProjectBoardDto) {
  return board.lists.map((list) => `${list.id}:${list.tasks.map((task) => task.id).join(",")}`).join("|")
}

/** Coordinates live task previews and one final authorized persistence request. */
export function useTaskDrag(projectId: string, board: ProjectBoardDto) {
  const router = useRouter()
  const setSaving = useBoardStore((state) => state.setSaving)
  const setError = useBoardStore((state) => state.setError)
  const restoreBoard = useBoardStore((state) => state.restoreBoard)
  const moveTaskOptimistically = useBoardStore((state) => state.moveTaskOptimistically)

  const previewTaskMove = useCallback(
    (taskId: string, targetListId: string, targetIndex: number) => {
      moveTaskOptimistically(projectId, board, taskId, targetListId, targetIndex)
    },
    [board, moveTaskOptimistically, projectId],
  )

  const cancelTaskMove = useCallback(
    (initialBoard: ProjectBoardDto) => {
      restoreBoard(projectId, initialBoard)
    },
    [projectId, restoreBoard],
  )

  const commitTaskMove = useCallback(
    async (taskId: string, initialBoard: ProjectBoardDto) => {
      const finalBoard =
        useBoardStore.getState().projectId === projectId && useBoardStore.getState().board
          ? useBoardStore.getState().board
          : board
      if (!finalBoard || taskOrder(initialBoard) === taskOrder(finalBoard)) return

      const source = taskLocation(initialBoard, taskId)
      const target = taskLocation(finalBoard, taskId)
      if (!source || !target) {
        restoreBoard(projectId, initialBoard)
        setError("Task is no longer available")
        return
      }

      setSaving(true)
      setError(null)

      try {
        if (source.list.id === target.list.id) {
          const result = await reorderTasksCommandAction({
            projectId,
            listId: target.list.id,
            taskIds: target.list.tasks.map((task) => task.id),
          })
          if (result.status === "error") throw new Error(result.message)
        } else {
          const result = await moveTaskCommandAction({
            projectId,
            taskId,
            sourceListId: source.list.id,
            targetListId: target.list.id,
            targetIndex: target.index,
          })
          if (result.status === "error") throw new Error(result.message)
        }
      } catch (error) {
        restoreBoard(projectId, initialBoard)
        setError(error instanceof Error ? error.message : "Unable to save task movement")
      } finally {
        setSaving(false)
        router.refresh()
      }
    },
    [board, projectId, restoreBoard, router, setError, setSaving],
  )

  return {
    isSaving: useBoardStore((state) => state.isSaving),
    error: useBoardStore((state) => state.error),
    previewTaskMove,
    commitTaskMove,
    cancelTaskMove,
  }
}
