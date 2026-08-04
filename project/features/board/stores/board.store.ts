"use client"

import { create } from "zustand"

import type { ProjectBoardDto } from "@/features/board/board.types"

type BoardState = {
  projectId: string | null
  board: ProjectBoardDto | null
  isSaving: boolean
  error: string | null
  setBoard: (projectId: string, board: ProjectBoardDto) => void
  restoreBoard: (projectId: string, board: ProjectBoardDto) => void
  moveTaskOptimistically: (
    projectId: string,
    fallbackBoard: ProjectBoardDto,
    taskId: string,
    targetListId: string,
    targetIndex: number,
  ) => void
  setSaving: (isSaving: boolean) => void
  setError: (error: string | null) => void
}

export function moveTaskOptimistically(
  board: ProjectBoardDto,
  taskId: string,
  targetListId: string,
  targetIndex: number,
): ProjectBoardDto {
  const sourceList = board.lists.find((list) => list.tasks.some((task) => task.id === taskId))
  const targetList = board.lists.find((list) => list.id === targetListId)
  if (!sourceList || !targetList) return board

  const task = sourceList.tasks.find((item) => item.id === taskId)
  if (!task) return board

  const sourceTasks = sourceList.tasks.filter((item) => item.id !== taskId)
  const targetTasks = sourceList.id === targetList.id ? sourceTasks : [...targetList.tasks]
  const insertionIndex = Math.max(0, Math.min(targetIndex, targetTasks.length))
  targetTasks.splice(insertionIndex, 0, task)

  return {
    ...board,
    lists: board.lists.map((list) => {
      if (list.id === sourceList.id) return { ...list, tasks: sourceTasks }
      if (list.id === targetList.id) return { ...list, tasks: targetTasks }
      return list
    }),
  }
}

export const useBoardStore = create<BoardState>((set) => ({
  projectId: null,
  board: null,
  isSaving: false,
  error: null,
  setBoard: (projectId, board) =>
    set((state) => ({ projectId, board, ...(state.projectId === projectId ? {} : { error: null, isSaving: false }) })),
  restoreBoard: (projectId, board) => set({ projectId, board }),
  moveTaskOptimistically: (projectId, fallbackBoard, taskId, targetListId, targetIndex) =>
    set((state) => {
      const board = state.projectId === projectId && state.board ? state.board : fallbackBoard
      return { projectId, board: moveTaskOptimistically(board, taskId, targetListId, targetIndex) }
    }),
  setSaving: (isSaving) => set({ isSaving }),
  setError: (error) => set({ error }),
}))
