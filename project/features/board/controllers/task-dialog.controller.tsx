"use client"

import { useRouter } from "next/navigation"
import { useActionState, useEffect, useRef, useState } from "react"

import { createTaskAction, updateTaskAction } from "@/features/board/actions/board.actions"
import type { BoardMemberDto, BoardTaskDto, ProjectBoardDto } from "@/features/board/board.types"
import { toggleLabelFilter } from "@/features/board/board-filtering"
import { TaskDialog } from "@/features/board/components/task-dialog"
import { useBoardStore } from "@/features/board/stores/board.store"
import type { LabelDto } from "@/features/labels/label.types"
import { initialActionState } from "@/lib/action-state"

type TaskDialogControllerProps = {
  projectId: string
  listId?: string
  members: BoardMemberDto[]
  labels: LabelDto[]
  board: ProjectBoardDto
  task?: BoardTaskDto
  onClose: () => void
  canAssignTasks: boolean
}

export function TaskDialogController(props: TaskDialogControllerProps) {
  const { board, labels, onClose, projectId, task, ...dialogProps } = props
  const router = useRouter()
  const action = task ? updateTaskAction : createTaskAction
  const [state, formAction, isPending] = useActionState(action, initialActionState)
  const [selectedLabelIds, setSelectedLabelIds] = useState(() => task?.labels.map((label) => label.id) ?? [])
  const previousBoard = useRef<ProjectBoardDto | null>(null)
  const setTaskLabelsOptimistically = useBoardStore((store) => store.setTaskLabelsOptimistically)
  const restoreBoard = useBoardStore((store) => store.restoreBoard)

  const beginOptimisticUpdate = () => {
    if (task) {
      const selectedLabels = labels.filter((label) => selectedLabelIds.includes(label.id))
      previousBoard.current = setTaskLabelsOptimistically(projectId, board, task.id, selectedLabels)
    }
  }

  useEffect(() => {
    if (state.status === "error" && previousBoard.current) {
      restoreBoard(projectId, previousBoard.current)
      previousBoard.current = null
    }
    if (state.status === "success") {
      previousBoard.current = null
      router.refresh()
      onClose()
    }
  }, [onClose, projectId, restoreBoard, router, state])

  return (
    <TaskDialog
      {...dialogProps}
      projectId={projectId}
      task={task}
      labels={labels}
      onClose={onClose}
      formAction={formAction}
      onSubmit={beginOptimisticUpdate}
      state={state}
      isPending={isPending}
      selectedLabelIds={selectedLabelIds}
      onLabelToggle={(labelId) => setSelectedLabelIds((current) => toggleLabelFilter(current, labelId))}
    />
  )
}
