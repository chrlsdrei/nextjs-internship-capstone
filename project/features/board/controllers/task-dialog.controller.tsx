"use client"

import { useActionState, useEffect } from "react"

import { createTaskAction, updateTaskAction } from "@/features/board/actions/board.actions"
import type { BoardMemberDto, BoardTaskDto } from "@/features/board/board.types"
import { TaskDialog } from "@/features/board/components/task-dialog"
import { initialActionState } from "@/lib/action-state"

type TaskDialogControllerProps = {
  projectId: string
  listId?: string
  members: BoardMemberDto[]
  task?: BoardTaskDto
  onClose: () => void
}

export function TaskDialogController(props: TaskDialogControllerProps) {
  const action = props.task ? updateTaskAction : createTaskAction
  const [state, formAction, isPending] = useActionState(action, initialActionState)

  useEffect(() => {
    if (state.status === "success") props.onClose()
  }, [props.onClose, state.status])

  return <TaskDialog {...props} formAction={formAction} state={state} isPending={isPending} />
}
