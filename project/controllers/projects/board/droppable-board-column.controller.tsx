"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { KeyboardEvent, PointerEvent } from "react"

import { BoardColumn } from "@/components/projects/board/board-column"
import { ListControlsController } from "@/controllers/projects/board/list-controls.controller"
import { SortableTaskController } from "@/controllers/projects/board/sortable-task.controller"
import type { BoardListDto, BoardTaskDto } from "@/features/board/board.types"

const COLUMN_DRAG_EXCLUSION_SELECTOR =
  '[data-column-drag-ignore],button,input,textarea,select,a,[role="button"],[contenteditable="true"]'

function startsFromColumnControl(target: EventTarget | null, currentTarget: EventTarget & HTMLDivElement) {
  if (!(target instanceof Element) || target === currentTarget) return false
  const excludedElement = target.closest(COLUMN_DRAG_EXCLUSION_SELECTOR)
  return excludedElement !== null && excludedElement !== currentTarget
}

export function DroppableBoardColumnController({
  projectId,
  list,
  originalList,
  listIds,
  canManage,
  canEdit,
  onAddTask,
  onEditTask,
}: {
  projectId: string
  list: BoardListDto
  originalList: BoardListDto
  listIds: string[]
  canManage: boolean
  canEdit: boolean
  onAddTask: () => void
  onEditTask: (task: BoardTaskDto) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `list:${list.id}` })
  const sortable = useSortable({
    id: `list-sort:${list.id}`,
    disabled: !canManage,
    data: { type: "list", listId: list.id },
  })
  const activateColumnWithPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (startsFromColumnControl(event.target, event.currentTarget)) return
    sortable.listeners?.onPointerDown?.(event)
  }
  const activateColumnWithKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (startsFromColumnControl(event.target, event.currentTarget)) return
    sortable.listeners?.onKeyDown?.(event)
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: the full sortable column contains nested controls, so it cannot be a button element.
    <div
      ref={sortable.setNodeRef}
      {...(canManage ? sortable.attributes : {})}
      role="button"
      tabIndex={canManage ? 0 : -1}
      aria-disabled={!canManage}
      aria-label={canManage ? `Drag ${list.name} list` : `${list.name} list`}
      onPointerDown={canManage ? activateColumnWithPointer : undefined}
      onKeyDown={canManage ? activateColumnWithKeyboard : undefined}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition ?? "transform 200ms cubic-bezier(0.2, 0, 0, 1)",
        opacity: sortable.isDragging ? 0.45 : 1,
        zIndex: sortable.isDragging ? 20 : undefined,
      }}
      className={
        canManage ? "shrink-0 cursor-grab touch-none will-change-transform active:cursor-grabbing" : "shrink-0"
      }
    >
      <BoardColumn
        list={list}
        totalTasks={originalList.tasks.length}
        addTask={canEdit ? onAddTask : undefined}
        isDropTarget={isOver || sortable.isOver}
        dropRef={setNodeRef}
        actions={
          canManage ? (
            <div className="flex items-center gap-0.5" data-column-drag-ignore>
              <ListControlsController
                projectId={projectId}
                list={originalList}
                listIds={listIds}
                index={listIds.indexOf(list.id)}
              />
            </div>
          ) : undefined
        }
      >
        <SortableContext items={list.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {list.tasks.map((task) => (
            <SortableTaskController key={task.id} task={task} canEdit={canEdit} onEdit={() => onEditTask(task)} />
          ))}
        </SortableContext>
      </BoardColumn>
    </div>
  )
}
