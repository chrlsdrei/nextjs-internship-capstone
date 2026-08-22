"use client"

import { arrayMove } from "@dnd-kit/sortable"
import { create } from "zustand"

import type { BoardMemberDto, BoardTaskDto, ProjectBoardDto } from "@/features/board/board.types"
import type { LabelDto } from "@/features/labels/label.types"

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
  reorderListsOptimistically: (
    projectId: string,
    fallbackBoard: ProjectBoardDto,
    activeListId: string,
    targetListId: string,
  ) => void
  setTaskLabelsOptimistically: (
    projectId: string,
    fallbackBoard: ProjectBoardDto,
    taskId: string,
    labels: LabelDto[],
  ) => ProjectBoardDto
  setTaskCollaborationOptimistically: (
    projectId: string,
    fallbackBoard: ProjectBoardDto,
    taskId: string,
    values: { assignees: BoardMemberDto[]; labels: LabelDto[] },
  ) => ProjectBoardDto
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

  const withPositions = (tasks: BoardTaskDto[]) =>
    tasks.map((item, position) => (item.position === position ? item : { ...item, position }))

  if (sourceList.id === targetList.id) {
    const sourceIndex = sourceList.tasks.findIndex((item) => item.id === taskId)
    const insertionIndex = Math.max(0, Math.min(targetIndex, sourceList.tasks.length - 1))
    if (sourceIndex === insertionIndex) return board
    const reorderedTasks = withPositions(arrayMove(sourceList.tasks, sourceIndex, insertionIndex))
    return {
      ...board,
      lists: board.lists.map((list) => (list.id === sourceList.id ? { ...list, tasks: reorderedTasks } : list)),
    }
  }

  const sourceTasks = withPositions(sourceList.tasks.filter((item) => item.id !== taskId))
  const targetTasks = [...targetList.tasks]
  const insertionIndex = Math.max(0, Math.min(targetIndex, targetTasks.length))
  targetTasks.splice(insertionIndex, 0, task)
  const positionedTargetTasks = withPositions(targetTasks)

  return {
    ...board,
    lists: board.lists.map((list) => {
      if (list.id === sourceList.id) return { ...list, tasks: sourceTasks }
      if (list.id === targetList.id) return { ...list, tasks: positionedTargetTasks }
      return list
    }),
  }
}

export function reorderBoardLists(board: ProjectBoardDto, activeListId: string, targetListId: string): ProjectBoardDto {
  const activeIndex = board.lists.findIndex((list) => list.id === activeListId)
  const targetIndex = board.lists.findIndex((list) => list.id === targetListId)
  if (activeIndex < 0 || targetIndex < 0 || activeIndex === targetIndex) return board
  return {
    ...board,
    lists: arrayMove(board.lists, activeIndex, targetIndex).map((list, position) =>
      list.position === position ? list : { ...list, position },
    ),
  }
}

export function updateTaskLabelsOptimistically(board: ProjectBoardDto, taskId: string, labels: LabelDto[]) {
  return {
    ...board,
    lists: board.lists.map((list) => ({
      ...list,
      tasks: list.tasks.map((task) => (task.id === taskId ? { ...task, labels } : task)),
    })),
  }
}

export function updateTaskCollaborationOptimistically(
  board: ProjectBoardDto,
  taskId: string,
  values: { assignees: BoardMemberDto[]; labels: LabelDto[] },
) {
  return {
    ...board,
    lists: board.lists.map((list) => ({
      ...list,
      tasks: list.tasks.map((task) => (task.id === taskId ? { ...task, ...values } : task)),
    })),
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
      const nextBoard = moveTaskOptimistically(board, taskId, targetListId, targetIndex)
      if (state.projectId === projectId && nextBoard === board) return state
      return { projectId, board: nextBoard }
    }),
  reorderListsOptimistically: (projectId, fallbackBoard, activeListId, targetListId) =>
    set((state) => {
      const board = state.projectId === projectId && state.board ? state.board : fallbackBoard
      const nextBoard = reorderBoardLists(board, activeListId, targetListId)
      if (state.projectId === projectId && nextBoard === board) return state
      return { projectId, board: nextBoard }
    }),
  setTaskLabelsOptimistically: (projectId, fallbackBoard, taskId, labels) => {
    let previousBoard = fallbackBoard
    set((state) => {
      previousBoard = state.projectId === projectId && state.board ? state.board : fallbackBoard
      return { projectId, board: updateTaskLabelsOptimistically(previousBoard, taskId, labels) }
    })
    return previousBoard
  },
  setTaskCollaborationOptimistically: (projectId, fallbackBoard, taskId, values) => {
    let previousBoard = fallbackBoard
    set((state) => {
      previousBoard = state.projectId === projectId && state.board ? state.board : fallbackBoard
      return { projectId, board: updateTaskCollaborationOptimistically(previousBoard, taskId, values) }
    })
    return previousBoard
  },
  setSaving: (isSaving) => set({ isSaving }),
  setError: (error) => set({ error }),
}))
