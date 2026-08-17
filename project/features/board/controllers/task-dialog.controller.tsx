"use client"

import { useRouter } from "next/navigation"
import { useActionState, useEffect, useRef, useState } from "react"

import { createTaskAction, updateTaskAction } from "@/features/board/actions/board.actions"
import type { BoardMemberDto, BoardTaskDto, ProjectBoardDto } from "@/features/board/board.types"
import { retainActiveMemberSelections, toggleAssigneeFilter, toggleLabelFilter } from "@/features/board/board-filtering"
import { TaskDialog } from "@/features/board/components/task-dialog"
import { useBoardStore } from "@/features/board/stores/board.store"
import { TaskCommentsController } from "@/features/comments/controllers/task-comments.controller"
import { LabelPaletteController } from "@/features/labels/controllers/label-palette.controller"
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
  canEditTask: boolean
  canAssignTasks: boolean
  canManageLabels: boolean
}

export function TaskDialogController(props: TaskDialogControllerProps) {
  const {
    board,
    canAssignTasks,
    canEditTask,
    canManageLabels,
    labels,
    members,
    onClose,
    projectId,
    task,
    ...dialogProps
  } = props
  const router = useRouter()
  const action = task ? updateTaskAction : createTaskAction
  const [state, formAction, isPending] = useActionState(action, initialActionState)
  const [selectedLabelIds, setSelectedLabelIds] = useState(() => task?.labels.map((label) => label.id) ?? [])
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState(
    () => task?.assignees.map((assignee) => assignee.id) ?? [],
  )
  const [assigneeSearch, setAssigneeSearch] = useState("")
  const previousBoard = useRef<ProjectBoardDto | null>(null)
  const setTaskCollaborationOptimistically = useBoardStore((store) => store.setTaskCollaborationOptimistically)
  const restoreBoard = useBoardStore((store) => store.restoreBoard)

  const beginOptimisticUpdate = () => {
    if (task && canEditTask) {
      const selectedLabels = labels.filter((label) => selectedLabelIds.includes(label.id))
      const selectedAssignees = canAssignTasks
        ? members.filter((member) => selectedAssigneeIds.includes(member.id))
        : task.assignees
      previousBoard.current = setTaskCollaborationOptimistically(projectId, board, task.id, {
        assignees: selectedAssignees,
        labels: selectedLabels,
      })
    }
  }

  useEffect(() => {
    setSelectedAssigneeIds((current) => retainActiveMemberSelections(current, members))
  }, [members])

  useEffect(() => {
    const availableLabelIds = new Set(labels.map((label) => label.id))
    setSelectedLabelIds((current) => {
      const retained = current.filter((id) => availableLabelIds.has(id))
      return retained.length === current.length ? current : retained
    })
  }, [labels])

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
      members={members}
      canAssignTasks={canAssignTasks}
      canEditTask={canEditTask}
      onClose={onClose}
      formAction={formAction}
      onSubmit={beginOptimisticUpdate}
      state={state}
      isPending={isPending}
      selectedLabelIds={selectedLabelIds}
      onLabelToggle={(labelId) => setSelectedLabelIds((current) => toggleLabelFilter(current, labelId))}
      selectedAssigneeIds={selectedAssigneeIds}
      assigneeSearch={assigneeSearch}
      onAssigneeSearchChange={setAssigneeSearch}
      onAssigneeToggle={(memberId) => setSelectedAssigneeIds((current) => toggleAssigneeFilter(current, memberId))}
      onAssigneeClear={() => setSelectedAssigneeIds([])}
      labelPalette={
        task && canManageLabels ? <LabelPaletteController projectId={projectId} labels={labels} /> : undefined
      }
      comments={
        task ? <TaskCommentsController projectId={projectId} taskId={task.id} canComment={canEditTask} /> : undefined
      }
    />
  )
}
