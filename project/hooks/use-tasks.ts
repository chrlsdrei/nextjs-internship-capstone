"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"

import {
  initialBoardActionState,
  moveTaskAction,
  reorderTasksAction,
} from "@/app/(dashboard)/projects/[id]/board-actions"
import type { ProjectBoard } from "@/lib/db/queries/board"
import { useBoardStore } from "@/stores/board-store"

function makeFormData(values: Record<string, string>) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(values)) formData.set(key, value)
  return formData
}

/** Coordinates optimistic task drags with the existing authorized server actions. */
export function useTasks(projectId: string, board: ProjectBoard) {
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
          const result = await reorderTasksAction(
            initialBoardActionState,
            makeFormData({ projectId, listId: sourceListId, taskIds: JSON.stringify(taskIds) }),
          )
          if (!result.success) throw new Error(result.error ?? "Unable to reorder task")
        } else {
          const result = await moveTaskAction(
            initialBoardActionState,
            makeFormData({ projectId, taskId, listId: targetListId, targetIndex: String(targetIndex) }),
          )
          if (!result.success) throw new Error(result.error ?? "Unable to move task")
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
