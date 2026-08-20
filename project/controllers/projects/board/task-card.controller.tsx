"use client"

import { TaskCard } from "@/components/projects/board/task-card"
import type { BoardTaskDto } from "@/features/board/board.types"

type TaskCardControllerProps = {
  task: BoardTaskDto
  canEdit: boolean
  onEdit: () => void
  isDragging?: boolean
  isOverlay?: boolean
}

export function TaskCardController(props: TaskCardControllerProps) {
  return <TaskCard task={props.task} isDragging={props.isDragging} isOverlay={props.isOverlay} />
}
