"use client"

import { DndContext, KeyboardSensor, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import type { BoardListDto, BoardTaskDto, ProjectBoardDto } from "@/features/board/board.types"
import { taskMatchesBoardFilters, toggleLabelFilter } from "@/features/board/board-filtering"
import { BoardColumn } from "@/features/board/components/board-column"
import { BoardFilters } from "@/features/board/components/board-filters"
import { CreateListController } from "@/features/board/controllers/create-list.controller"
import { ListControlsController } from "@/features/board/controllers/list-controls.controller"
import { TaskCardController } from "@/features/board/controllers/task-card.controller"
import { TaskDialogController } from "@/features/board/controllers/task-dialog.controller"
import { useTaskDrag } from "@/features/board/controllers/use-task-drag"
import { useBoardStore } from "@/features/board/stores/board.store"
import { LabelPaletteController } from "@/features/labels/controllers/label-palette.controller"

function SortableTask({
  task,
  ...props
}: Omit<Parameters<typeof TaskCardController>[0], "task" | "dragHandle"> & { task: BoardTaskDto }) {
  const sortable = useSortable({ id: task.id })

  return (
    <div
      ref={sortable.setNodeRef}
      style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}
      className={sortable.isDragging ? "opacity-40" : undefined}
    >
      <TaskCardController
        {...props}
        task={task}
        dragHandle={
          props.canEdit ? (
            <button
              type="button"
              className="rounded p-1 text-paynes-gray-500 hover:bg-platinum-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-munsell-500"
              aria-label={`Drag ${task.title}`}
              {...sortable.attributes}
              {...sortable.listeners}
            >
              <GripVertical size={16} />
            </button>
          ) : undefined
        }
      />
    </div>
  )
}

function DroppableBoardColumn({
  projectId,
  list,
  originalList,
  allLists,
  listIds,
  canManage,
  canEdit,
  onAddTask,
  onEditTask,
}: {
  projectId: string
  list: BoardListDto
  originalList: BoardListDto
  allLists: BoardListDto[]
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
      header={
        canManage ? (
          <ListControlsController
            projectId={projectId}
            list={originalList}
            listIds={listIds}
            index={listIds.indexOf(list.id)}
          />
        ) : (
          <h2 className="font-semibold text-outer-space-500 dark:text-platinum-500">{list.name}</h2>
        )
      }
    >
      <SortableContext items={list.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        {list.tasks.map((task) => (
          <SortableTask
            key={task.id}
            projectId={projectId}
            task={task}
            lists={allLists}
            listId={list.id}
            taskIds={originalList.tasks.map((item) => item.id)}
            index={originalList.tasks.findIndex((item) => item.id === task.id)}
            canDelete={canManage}
            canEdit={canEdit}
            onEdit={() => canEdit && onEditTask(task)}
          />
        ))}
      </SortableContext>
    </BoardColumn>
  )
}

export function BoardController({ projectId, serverBoard }: { projectId: string; serverBoard: ProjectBoardDto }) {
  const [search, setSearch] = useState("")
  const [priority, setPriority] = useState<"all" | BoardTaskDto["priority"]>("all")
  const [assigneeId, setAssigneeId] = useState("all")
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([])
  const [createListId, setCreateListId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<BoardTaskDto | null>(null)
  const storedProjectId = useBoardStore((state) => state.projectId)
  const storedBoard = useBoardStore((state) => state.board)
  const board = storedProjectId === projectId && storedBoard ? storedBoard : serverBoard
  const setBoard = useBoardStore((state) => state.setBoard)
  const { moveTask, isSaving, error } = useTaskDrag(projectId, board)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => setBoard(projectId, serverBoard), [projectId, serverBoard, setBoard])
  useEffect(() => {
    const availableIds = new Set(board.labels.map((label) => label.id))
    setSelectedLabelIds((current) => current.filter((id) => availableIds.has(id)))
  }, [board.labels])

  const canManage = board.capabilities.canManageLists
  const canEdit = board.capabilities.canEditTasks
  const listIds = board.lists.map((list) => list.id)
  const visibleLists = useMemo(() => {
    return board.lists.map((list) => ({
      ...list,
      tasks: list.tasks.filter((task) =>
        taskMatchesBoardFilters(task, { search, priority, assigneeId, labelIds: selectedLabelIds }),
      ),
    }))
  }, [assigneeId, board.lists, priority, search, selectedLabelIds])

  return (
    <section aria-label="Project board" className="space-y-4">
      {canManage && <LabelPaletteController projectId={projectId} labels={board.labels} />}
      <BoardFilters
        search={search}
        priority={priority}
        assigneeId={assigneeId}
        selectedLabelIds={selectedLabelIds}
        members={board.members}
        labels={board.labels}
        onSearchChange={setSearch}
        onPriorityChange={setPriority}
        onAssigneeChange={setAssigneeId}
        onLabelToggle={(labelId) => setSelectedLabelIds((current) => toggleLabelFilter(current, labelId))}
        onClearLabels={() => setSelectedLabelIds([])}
      />
      <p className="sr-only" role="status" aria-live="polite">
        {isSaving ? "Saving task movement" : (error ?? "")}
      </p>
      {board.lists.length === 0 ? (
        <div className="rounded-lg border border-dashed border-french-gray-300 p-8 text-center dark:border-paynes-gray-400">
          <h2 className="font-semibold">This board has no lists yet</h2>
          <p className="mt-1 text-sm text-paynes-gray-500 dark:text-french-gray-400">
            {canManage
              ? "Create a list to start adding tasks."
              : "Ask a project administrator to create the first list."}
          </p>
          {canManage && (
            <div className="mx-auto mt-4 max-w-sm">
              <CreateListController projectId={projectId} />
            </div>
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragEnd={({ active, over }) => {
            if (!canEdit) return
            if (!over || active.id === over.id) return
            const sourceList = board.lists.find((list) => list.tasks.some((task) => task.id === active.id))
            if (!sourceList) return
            const targetList = String(over.id).startsWith("list:")
              ? board.lists.find((list) => list.id === String(over.id).slice(5))
              : board.lists.find((list) => list.tasks.some((task) => task.id === over.id))
            if (!targetList) return
            const targetIndex = String(over.id).startsWith("list:")
              ? targetList.tasks.length
              : targetList.tasks.findIndex((task) => task.id === over.id)
            void moveTask(String(active.id), sourceList.id, targetList.id, targetIndex)
          }}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {visibleLists.map((list) => {
              const originalList = board.lists.find((candidate) => candidate.id === list.id)
              if (!originalList) return null
              return (
                <DroppableBoardColumn
                  key={list.id}
                  projectId={projectId}
                  list={list}
                  originalList={originalList}
                  allLists={board.lists}
                  listIds={listIds}
                  canManage={canManage}
                  canEdit={canEdit}
                  onAddTask={() => setCreateListId(list.id)}
                  onEditTask={setEditingTask}
                />
              )
            })}
            {canManage && <CreateListController projectId={projectId} />}
          </div>
        </DndContext>
      )}
      {canEdit && createListId && (
        <TaskDialogController
          projectId={projectId}
          listId={createListId}
          members={board.members}
          labels={board.labels}
          board={board}
          canAssignTasks={board.capabilities.canAssignTasks}
          onClose={() => setCreateListId(null)}
        />
      )}
      {canEdit && editingTask && (
        <TaskDialogController
          projectId={projectId}
          members={board.members}
          labels={board.labels}
          board={board}
          canAssignTasks={board.capabilities.canAssignTasks}
          task={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </section>
  )
}
