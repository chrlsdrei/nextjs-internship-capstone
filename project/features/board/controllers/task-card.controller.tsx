"use client"

import type { BoardTaskDto } from "@/features/board/board.types"
import { TaskCard } from "@/features/board/components/task-card"

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
