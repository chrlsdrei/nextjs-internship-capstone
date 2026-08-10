"use client"

import type { ReactNode } from "react"
import { useActionState } from "react"

import { deleteTaskAction, moveTaskAction, reorderTasksAction } from "@/features/board/actions/board.actions"
import type { BoardListDto, BoardTaskDto } from "@/features/board/board.types"
import { actionStateError, TaskCard } from "@/features/board/components/task-card"
import { initialActionState } from "@/lib/action-state"

type TaskCardControllerProps = {
  projectId: string
  task: BoardTaskDto
  lists: BoardListDto[]
  listId: string
  taskIds: string[]
  index: number
  canDelete: boolean
  canEdit: boolean
  onEdit: () => void
  dragHandle?: ReactNode
}

export function TaskCardController(props: TaskCardControllerProps) {
  const [moveState, moveAction, moving] = useActionState(moveTaskAction, initialActionState)
  const [deleteState, deleteAction, deleting] = useActionState(deleteTaskAction, initialActionState)
  const [reorderState, reorderAction, reordering] = useActionState(reorderTasksAction, initialActionState)

  return (
    <TaskCard
      {...props}
      moveAction={moveAction}
      deleteAction={deleteAction}
      reorderAction={reorderAction}
      moving={moving}
      deleting={deleting}
      reordering={reordering}
      error={actionStateError(moveState, deleteState, reorderState)}
    />
  )
}
