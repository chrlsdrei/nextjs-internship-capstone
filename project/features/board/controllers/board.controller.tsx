"use client"

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  type UniqueIdentifier,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useEffect, useMemo, useRef, useState } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import type { BoardListDto, BoardTaskDto, ProjectBoardDto } from "@/features/board/board.types"
import {
  retainActiveMemberSelections,
  taskMatchesBoardFilters,
  toggleAssigneeFilter,
  toggleLabelFilter,
} from "@/features/board/board-filtering"
import { BoardColumn } from "@/features/board/components/board-column"
import { BoardFilters } from "@/features/board/components/board-filters"
import { CreateListController } from "@/features/board/controllers/create-list.controller"
import { ListControlsController } from "@/features/board/controllers/list-controls.controller"
import { TaskCardController } from "@/features/board/controllers/task-card.controller"
import { TaskDialogController } from "@/features/board/controllers/task-dialog.controller"
import { useTaskDrag } from "@/features/board/controllers/use-task-drag"
import { moveTaskOptimistically as calculateTaskMove, useBoardStore } from "@/features/board/stores/board.store"

type TaskMovePreview = [taskId: string, targetListId: string, targetIndex: number]

function SortableTask({
  task,
  ...props
}: Omit<Parameters<typeof TaskCardController>[0], "task" | "isDragging" | "isOverlay"> & { task: BoardTaskDto }) {
  const sortable = useSortable({ id: task.id, disabled: !props.canEdit })

  return (
    // biome-ignore lint/a11y/useSemanticElements: the sortable surface contains nested task controls, so it cannot be a button element.
    <div
      ref={sortable.setNodeRef}
      style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}
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

function locateTask(board: ProjectBoardDto, taskId: UniqueIdentifier) {
  const list = board.lists.find((candidate) => candidate.tasks.some((task) => task.id === String(taskId)))
  if (!list) return null
  const index = list.tasks.findIndex((task) => task.id === String(taskId))
  return { list, index, task: list.tasks[index] }
}

function currentStoredBoard(projectId: string, fallback: ProjectBoardDto) {
  const state = useBoardStore.getState()
  return state.projectId === projectId && state.board ? state.board : fallback
}

function DroppableBoardColumn({
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
          <SortableTask key={task.id} task={task} canEdit={canEdit} onEdit={() => onEditTask(task)} />
        ))}
      </SortableContext>
    </BoardColumn>
  )
}

export function BoardController({ projectId, serverBoard }: { projectId: string; serverBoard: ProjectBoardDto }) {
  const [search, setSearch] = useState("")
  const [priority, setPriority] = useState<"all" | BoardTaskDto["priority"]>("all")
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([])
  const [includeUnassigned, setIncludeUnassigned] = useState(false)
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([])
  const [createListId, setCreateListId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<BoardTaskDto | null>(null)
  const [activeDrag, setActiveDrag] = useState<{ taskId: string; initialBoard: ProjectBoardDto } | null>(null)
  const previewFrameRef = useRef<number | null>(null)
  const pendingPreviewRef = useRef<TaskMovePreview | null>(null)
  const lastPreviewOrderRef = useRef<string | null>(null)
  const storedProjectId = useBoardStore((state) => state.projectId)
  const storedBoard = useBoardStore((state) => state.board)
  const board = storedProjectId === projectId && storedBoard ? storedBoard : serverBoard
  const setBoard = useBoardStore((state) => state.setBoard)
  const { previewTaskMove, commitTaskMove, cancelTaskMove, isSaving, error } = useTaskDrag(projectId, board)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => setBoard(projectId, serverBoard), [projectId, serverBoard, setBoard])
  useEffect(() => {
    const availableIds = new Set(board.labels.map((label) => label.id))
    setSelectedLabelIds((current) => current.filter((id) => availableIds.has(id)))
  }, [board.labels])
  useEffect(() => {
    setSelectedAssigneeIds((current) => retainActiveMemberSelections(current, board.members))
  }, [board.members])
  useEffect(() => {
    setEditingTask((current) => {
      if (!current) return null
      return board.lists.flatMap((list) => list.tasks).find((task) => task.id === current.id) ?? null
    })
  }, [board.lists])
  useEffect(
    () => () => {
      if (previewFrameRef.current !== null) cancelAnimationFrame(previewFrameRef.current)
    },
    [],
  )

  const canManage = board.capabilities.canManageLists
  const canEdit = board.capabilities.canEditTasks
  const listIds = board.lists.map((list) => list.id)
  const visibleLists = useMemo(() => {
    return board.lists.map((list) => ({
      ...list,
      tasks: list.tasks.filter((task) =>
        taskMatchesBoardFilters(task, {
          search,
          priority,
          assigneeIds: selectedAssigneeIds,
          includeUnassigned,
          labelIds: selectedLabelIds,
        }),
      ),
    }))
  }, [board.lists, includeUnassigned, priority, search, selectedAssigneeIds, selectedLabelIds])
  const overlayLocation = activeDrag
    ? (locateTask(board, activeDrag.taskId) ?? locateTask(activeDrag.initialBoard, activeDrag.taskId))
    : null

  const boardOrder = (value: ProjectBoardDto) =>
    value.lists.map((list) => `${list.id}:${list.tasks.map((task) => task.id).join(",")}`).join("|")

  const applyPreview = (taskId: string, targetListId: string, targetIndex: number) => {
    const currentBoard = currentStoredBoard(projectId, board)
    const nextBoard = calculateTaskMove(currentBoard, taskId, targetListId, targetIndex)
    if (nextBoard === currentBoard) return
    const nextOrder = boardOrder(nextBoard)
    if (lastPreviewOrderRef.current === nextOrder) return
    lastPreviewOrderRef.current = nextOrder
    previewTaskMove(taskId, targetListId, targetIndex)
  }

  const cancelScheduledPreview = () => {
    if (previewFrameRef.current !== null) cancelAnimationFrame(previewFrameRef.current)
    previewFrameRef.current = null
    pendingPreviewRef.current = null
  }

  const schedulePreview = (...preview: TaskMovePreview) => {
    pendingPreviewRef.current = preview
    if (previewFrameRef.current !== null) return
    previewFrameRef.current = requestAnimationFrame(() => {
      previewFrameRef.current = null
      const pending = pendingPreviewRef.current
      pendingPreviewRef.current = null
      if (pending) applyPreview(...pending)
    })
  }

  const flushScheduledPreview = () => {
    if (previewFrameRef.current !== null) cancelAnimationFrame(previewFrameRef.current)
    previewFrameRef.current = null
    const pending = pendingPreviewRef.current
    pendingPreviewRef.current = null
    if (pending) applyPreview(...pending)
  }

  const previewAtTarget = (
    activeId: UniqueIdentifier,
    overId: UniqueIdentifier,
    activeTop: number | undefined,
    overTop: number,
    overHeight: number,
  ) => {
    if (activeId === overId) return
    const currentBoard = currentStoredBoard(projectId, board)
    const source = locateTask(currentBoard, activeId)
    if (!source) return

    const overValue = String(overId)
    if (overValue.startsWith("list:")) {
      const targetListId = overValue.slice(5)
      const targetList = currentBoard.lists.find((list) => list.id === targetListId)
      if (!targetList) return
      schedulePreview(String(activeId), targetListId, targetList.tasks.length)
      return
    }

    const target = locateTask(currentBoard, overId)
    if (!target) return
    const insertAfterTarget = activeTop !== undefined && activeTop > overTop + overHeight / 2
    let targetIndex = target.index + (insertAfterTarget ? 1 : 0)
    if (source.list.id === target.list.id && source.index < targetIndex) {
      targetIndex -= 1
    }
    if (source.list.id === target.list.id && source.index === targetIndex) return
    schedulePreview(String(activeId), target.list.id, targetIndex)
  }

  return (
    <section aria-label="Project board" className="space-y-4">
      <BoardFilters
        search={search}
        priority={priority}
        selectedAssigneeIds={selectedAssigneeIds}
        includeUnassigned={includeUnassigned}
        selectedLabelIds={selectedLabelIds}
        members={board.members}
        labels={board.labels}
        onSearchChange={setSearch}
        onPriorityChange={setPriority}
        onAssigneeToggle={(memberId) => setSelectedAssigneeIds((current) => toggleAssigneeFilter(current, memberId))}
        onUnassignedToggle={() => setIncludeUnassigned((current) => !current)}
        onClearAssignees={() => {
          setSelectedAssigneeIds([])
          setIncludeUnassigned(false)
        }}
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
          collisionDetection={closestCenter}
          onDragStart={({ active }) => {
            if (!canEdit || !locateTask(board, active.id)) return
            cancelScheduledPreview()
            useBoardStore.getState().setError(null)
            lastPreviewOrderRef.current = boardOrder(board)
            setActiveDrag({ taskId: String(active.id), initialBoard: board })
          }}
          onDragOver={({ active, over }) => {
            if (!canEdit || !over) return
            previewAtTarget(active.id, over.id, active.rect.current.translated?.top, over.rect.top, over.rect.height)
          }}
          onDragEnd={({ active, over }) => {
            if (!activeDrag) return
            cancelScheduledPreview()
            if (!over) {
              cancelTaskMove(activeDrag.initialBoard)
              setActiveDrag(null)
              return
            }
            previewAtTarget(active.id, over.id, active.rect.current.translated?.top, over.rect.top, over.rect.height)
            flushScheduledPreview()
            const initialBoard = activeDrag.initialBoard
            lastPreviewOrderRef.current = null
            setActiveDrag(null)
            void commitTaskMove(String(active.id), initialBoard)
          }}
          onDragCancel={() => {
            if (activeDrag) cancelTaskMove(activeDrag.initialBoard)
            cancelScheduledPreview()
            lastPreviewOrderRef.current = null
            setActiveDrag(null)
          }}
        >
          <ScrollArea orientation="horizontal" className="flex items-start gap-4 px-1 pb-4 pt-5">
            {visibleLists.map((list) => {
              const originalList = board.lists.find((candidate) => candidate.id === list.id)
              if (!originalList) return null
              return (
                <DroppableBoardColumn
                  key={list.id}
                  projectId={projectId}
                  list={list}
                  originalList={originalList}
                  listIds={listIds}
                  canManage={canManage}
                  canEdit={canEdit}
                  onAddTask={() => setCreateListId(list.id)}
                  onEditTask={setEditingTask}
                />
              )
            })}
            {canManage && <CreateListController projectId={projectId} />}
          </ScrollArea>
          <DragOverlay>
            {overlayLocation?.task ? (
              <div className="pointer-events-none w-[min(19rem,calc(100vw-3rem))] scale-[1.015] opacity-95 drop-shadow-[0_18px_25px_rgb(0_0_0/0.5)]">
                <TaskCardController task={overlayLocation.task} canEdit={canEdit} onEdit={() => undefined} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
      {canEdit && createListId && (
        <TaskDialogController
          projectId={projectId}
          listId={createListId}
          members={board.members}
          labels={board.labels}
          board={board}
          canEditTask={true}
          canAssignTasks={board.capabilities.canAssignTasks}
          canManageLabels={canManage}
          canDeleteTask={board.capabilities.canDeleteTasks}
          onClose={() => setCreateListId(null)}
        />
      )}
      {editingTask && (
        <TaskDialogController
          projectId={projectId}
          members={board.members}
          labels={board.labels}
          board={board}
          canEditTask={canEdit}
          canAssignTasks={board.capabilities.canAssignTasks}
          canManageLabels={canManage}
          canDeleteTask={board.capabilities.canDeleteTasks}
          task={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </section>
  )
}
