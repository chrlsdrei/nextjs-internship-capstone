"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

import { BoardColumn } from "@/components/projects/board/board-column"
import { ListControlsController } from "@/controllers/projects/board/list-controls.controller"
import { SortableTaskController } from "@/controllers/projects/board/sortable-task.controller"
import type { BoardListDto, BoardTaskDto } from "@/features/board/board.types"

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

  return (
    <BoardColumn
      list={list}
      totalTasks={originalList.tasks.length}
      addTask={canEdit ? onAddTask : undefined}
      isDropTarget={isOver}
      dropRef={setNodeRef}
      actions={
        canManage ? (
          <ListControlsController
            projectId={projectId}
            list={originalList}
            listIds={listIds}
            index={listIds.indexOf(list.id)}
          />
        ) : undefined
      }
    >
      <SortableContext items={list.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        {list.tasks.map((task) => (
          <SortableTaskController key={task.id} task={task} canEdit={canEdit} onEdit={() => onEditTask(task)} />
        ))}
      </SortableContext>
    </BoardColumn>
  )
}
