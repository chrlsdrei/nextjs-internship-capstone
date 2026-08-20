"use client"

import type { UniqueIdentifier } from "@dnd-kit/core"
import { useEffect, useRef } from "react"

import { moveTaskOptimistically as calculateTaskMove, useBoardStore } from "@/controllers/projects/board/board.store"
import type { ProjectBoardDto } from "@/features/board/board.types"

type TaskMovePreview = [taskId: string, targetListId: string, targetIndex: number]

export function locateTask(board: ProjectBoardDto, taskId: UniqueIdentifier) {
  const list = board.lists.find((candidate) => candidate.tasks.some((task) => task.id === String(taskId)))
  if (!list) return null
  const index = list.tasks.findIndex((task) => task.id === String(taskId))
  return { list, index, task: list.tasks[index] }
}

function currentStoredBoard(projectId: string, fallback: ProjectBoardDto) {
  const state = useBoardStore.getState()
  return state.projectId === projectId && state.board ? state.board : fallback
}

function boardOrder(board: ProjectBoardDto) {
  return board.lists.map((list) => `${list.id}:${list.tasks.map((task) => task.id).join(",")}`).join("|")
}

export function useBoardTaskPreview(
  projectId: string,
  board: ProjectBoardDto,
  previewTaskMove: (taskId: string, targetListId: string, targetIndex: number) => void,
) {
  const previewFrameRef = useRef<number | null>(null)
  const pendingPreviewRef = useRef<TaskMovePreview | null>(null)
  const lastPreviewOrderRef = useRef<string | null>(null)

  const applyPreview = (taskId: string, targetListId: string, targetIndex: number) => {
    const currentBoard = currentStoredBoard(projectId, board)
    const nextBoard = calculateTaskMove(currentBoard, taskId, targetListId, targetIndex)
    if (nextBoard === currentBoard) return
    const nextOrder = boardOrder(nextBoard)
    if (lastPreviewOrderRef.current === nextOrder) return
    lastPreviewOrderRef.current = nextOrder
    previewTaskMove(taskId, targetListId, targetIndex)
  }

  const cancelScheduledPreview = () => {
    if (previewFrameRef.current !== null) cancelAnimationFrame(previewFrameRef.current)
    previewFrameRef.current = null
    pendingPreviewRef.current = null
  }

  const schedulePreview = (...preview: TaskMovePreview) => {
    pendingPreviewRef.current = preview
    if (previewFrameRef.current !== null) return
    previewFrameRef.current = requestAnimationFrame(() => {
      previewFrameRef.current = null
      const pending = pendingPreviewRef.current
      pendingPreviewRef.current = null
      if (pending) applyPreview(...pending)
    })
  }

  const flushScheduledPreview = () => {
    if (previewFrameRef.current !== null) cancelAnimationFrame(previewFrameRef.current)
    previewFrameRef.current = null
    const pending = pendingPreviewRef.current
    pendingPreviewRef.current = null
    if (pending) applyPreview(...pending)
  }

  const previewAtTarget = (
    activeId: UniqueIdentifier,
    overId: UniqueIdentifier,
    activeTop: number | undefined,
    overTop: number,
    overHeight: number,
  ) => {
    if (activeId === overId) return
    const currentBoard = currentStoredBoard(projectId, board)
    const source = locateTask(currentBoard, activeId)
    if (!source) return

    const overValue = String(overId)
    if (overValue.startsWith("list:")) {
      const targetList = currentBoard.lists.find((list) => list.id === overValue.slice(5))
      if (targetList) schedulePreview(String(activeId), targetList.id, targetList.tasks.length)
      return
    }

    const target = locateTask(currentBoard, overId)
    if (!target) return
    const insertAfterTarget = activeTop !== undefined && activeTop > overTop + overHeight / 2
    let targetIndex = target.index + (insertAfterTarget ? 1 : 0)
    if (source.list.id === target.list.id && source.index < targetIndex) targetIndex -= 1
    if (source.list.id === target.list.id && source.index === targetIndex) return
    schedulePreview(String(activeId), target.list.id, targetIndex)
  }

  useEffect(
    () => () => {
      if (previewFrameRef.current !== null) cancelAnimationFrame(previewFrameRef.current)
      previewFrameRef.current = null
      pendingPreviewRef.current = null
    },
    [],
  )

  return {
    beginPreview: (initialBoard: ProjectBoardDto) => {
      cancelScheduledPreview()
      lastPreviewOrderRef.current = boardOrder(initialBoard)
    },
    cancelScheduledPreview,
    flushScheduledPreview,
    previewAtTarget,
    finishPreview: () => {
      lastPreviewOrderRef.current = null
    },
  }
}
