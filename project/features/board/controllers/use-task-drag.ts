"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"

import { moveTaskCommandAction, reorderTasksCommandAction } from "@/features/board/actions/board.actions"
import type { ProjectBoardDto } from "@/features/board/board.types"
import { useBoardStore } from "@/features/board/stores/board.store"

/** Coordinates optimistic task drags with the existing authorized server actions. */
export function useTaskDrag(projectId: string, board: ProjectBoardDto) {
  const router = useRouter()
  const setSaving = useBoardStore((state) => state.setSaving)
  const setError = useBoardStore((state) => state.setError)
  const restoreBoard = useBoardStore((state) => state.restoreBoard)
  const moveTaskOptimistically = useBoardStore((state) => state.moveTaskOptimistically)

  const moveTask = useCallback(
    async (taskId: string, sourceListId: string, targetListId: string, targetIndex: number) => {
      const previousBoard = board
      moveTaskOptimistically(projectId, previousBoard, taskId, targetListId, targetIndex)
      setSaving(true)
      setError(null)

      try {
        if (sourceListId === targetListId) {
          const sourceList = previousBoard.lists.find((list) => list.id === sourceListId)
          const activeTask = sourceList?.tasks.find((task) => task.id === taskId)
          if (!sourceList || !activeTask) throw new Error("Task is no longer available")
          const taskIds = sourceList.tasks.filter((task) => task.id !== taskId).map((task) => task.id)
          taskIds.splice(Math.max(0, Math.min(targetIndex, taskIds.length)), 0, activeTask.id)
          const result = await reorderTasksCommandAction({ projectId, listId: sourceListId, taskIds })
          if (result.status === "error") throw new Error(result.message)
        } else {
          const result = await moveTaskCommandAction({
            projectId,
            taskId,
            sourceListId,
            targetListId,
            targetIndex,
          })
          if (result.status === "error") throw new Error(result.message)
        }
      } catch (error) {
        restoreBoard(projectId, previousBoard)
        setError(error instanceof Error ? error.message : "Unable to save task movement")
      } finally {
        setSaving(false)
        router.refresh()
      }
    },
    [board, moveTaskOptimistically, projectId, restoreBoard, router, setError, setSaving],
  )

  return {
    isSaving: useBoardStore((state) => state.isSaving),
    error: useBoardStore((state) => state.error),
    moveTask,
  }
}
