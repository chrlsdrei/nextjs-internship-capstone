"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { TaskCardController } from "@/controllers/projects/board/task-card.controller"
import type { BoardTaskDto } from "@/features/board/board.types"

type SortableTaskControllerProps = Omit<
  Parameters<typeof TaskCardController>[0],
  "task" | "isDragging" | "isOverlay"
> & { task: BoardTaskDto }

export function SortableTaskController({ task, ...props }: SortableTaskControllerProps) {
  const sortable = useSortable({ id: task.id, disabled: !props.canEdit })

  return (
    // biome-ignore lint/a11y/useSemanticElements: the sortable surface contains nested task controls, so it cannot be a button element.
    <div
      ref={sortable.setNodeRef}
      data-column-drag-ignore
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition ?? "transform 180ms cubic-bezier(0.2, 0, 0, 1)",
      }}
      className={props.canEdit ? "cursor-grab touch-none active:cursor-grabbing" : "cursor-pointer"}
      {...(props.canEdit ? sortable.attributes : {})}
      {...(props.canEdit ? sortable.listeners : {})}
      role="button"
      tabIndex={0}
      onClick={props.onEdit}
      onKeyDown={(event) => {
        if (props.canEdit) sortable.listeners?.onKeyDown?.(event)
        if (!event.defaultPrevented && event.key === "Enter") {
          event.preventDefault()
          props.onEdit()
        }
      }}
    >
      <TaskCardController {...props} task={task} isDragging={sortable.isDragging} />
    </div>
  )
}
