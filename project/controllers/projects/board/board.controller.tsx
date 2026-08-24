"use client"

import {
  type CollisionDetection,
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { useEffect, useState } from "react"
import { BoardFilterModal } from "@/components/modals/board/board-filter-modal"
import { BoardColumn } from "@/components/projects/board/board-column"
import { BoardToolbar } from "@/components/projects/board/board-toolbar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useBoardStore } from "@/controllers/projects/board/board.store"
import { BoardAiControlsController } from "@/controllers/projects/board/board-ai-controls.controller"
import { CreateListController } from "@/controllers/projects/board/create-list.controller"
import { DroppableBoardColumnController } from "@/controllers/projects/board/droppable-board-column.controller"
import { TaskCardController } from "@/controllers/projects/board/task-card.controller"
import { TaskDialogController } from "@/controllers/projects/board/task-dialog.controller"
import { useBoardFilters } from "@/controllers/projects/board/use-board-filters"
import { locateTask, useBoardTaskPreview } from "@/controllers/projects/board/use-board-task-preview"
import { useListDrag } from "@/controllers/projects/board/use-list-drag"
import { useTaskDrag } from "@/controllers/projects/board/use-task-drag"
import { LeaveBoardController } from "@/controllers/projects/leave-board.controller"
import type { BoardSummaryDto } from "@/features/ai/ai-usage.types"
import type { UserAiEntitlementDto, WorkspaceEntitlementDto } from "@/features/billing/billing.types"
import type { BoardTaskDto, ProjectBoardDto } from "@/features/board/board.types"
import { toggleAssigneeFilter, toggleLabelFilter } from "@/features/board/board-filtering"

const boardCollisionDetection: CollisionDetection = (args) => {
  if (!String(args.active.id).startsWith("list-sort:")) return closestCenter(args)

  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter((container) => String(container.id).startsWith("list-sort:")),
  })
}

export function BoardController({
  projectId,
  projectTitle,
  projectDescription,
  serverBoard,
  aiData,
}: {
  projectId: string
  projectTitle: string
  projectDescription: string | null
  serverBoard: ProjectBoardDto
  aiData: {
    userEntitlement: UserAiEntitlementDto
    workspaceEntitlement: WorkspaceEntitlementDto
    summaries: BoardSummaryDto[]
  }
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [createListId, setCreateListId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<BoardTaskDto | null>(null)
  const [activeDrag, setActiveDrag] = useState<{ taskId: string; initialBoard: ProjectBoardDto } | null>(null)
  const storedProjectId = useBoardStore((state) => state.projectId)
  const storedBoard = useBoardStore((state) => state.board)
  const board = storedProjectId === projectId && storedBoard ? storedBoard : serverBoard
  const setBoard = useBoardStore((state) => state.setBoard)
  const { previewTaskMove, commitTaskMove, cancelTaskMove, isSaving, error } = useTaskDrag(projectId, board)
  const { activeListId, beginListDrag, previewListDrag, commitListDrag, cancelListDrag } = useListDrag(projectId, board)
  const {
    search,
    setSearch,
    priority,
    setPriority,
    selectedAssigneeIds,
    setSelectedAssigneeIds,
    includeUnassigned,
    setIncludeUnassigned,
    selectedLabelIds,
    setSelectedLabelIds,
    visibleLists,
    activeFilterCount,
  } = useBoardFilters(board)
  const { beginPreview, cancelScheduledPreview, finishPreview, flushScheduledPreview, previewAtTarget } =
    useBoardTaskPreview(projectId, board, previewTaskMove)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => setBoard(projectId, serverBoard), [projectId, serverBoard, setBoard])
  useEffect(() => {
    setEditingTask((current) => {
      if (!current) return null
      return board.lists.flatMap((list) => list.tasks).find((task) => task.id === current.id) ?? null
    })
  }, [board.lists])

  const canManage = board.capabilities.canManageLists
  const canEdit = board.capabilities.canEditTasks
  const listIds = board.lists.map((list) => list.id)
  const overlayLocation = activeDrag
    ? (locateTask(board, activeDrag.taskId) ?? locateTask(activeDrag.initialBoard, activeDrag.taskId))
    : null
  const activeListOverlay = activeListId
    ? (visibleLists.find((list) => list.id === activeListId) ?? board.lists.find((list) => list.id === activeListId))
    : null

  return (
    <section aria-label="Project board" className="space-y-4">
      <BoardToolbar
        projectId={projectId}
        title={projectTitle}
        description={projectDescription}
        search={search}
        activeFilterCount={activeFilterCount}
        canManage={canManage}
        onSearchChange={setSearch}
        onOpenFilters={() => setFiltersOpen(true)}
        aiControls={
          <BoardAiControlsController
            projectId={projectId}
            lists={board.lists}
            canEdit={canEdit}
            userEntitlement={aiData.userEntitlement}
            workspaceEntitlement={aiData.workspaceEntitlement}
            initialSummaries={aiData.summaries}
          />
        }
        membershipControls={
          board.capabilities.canLeaveBoard ? (
            <LeaveBoardController projectId={projectId} projectTitle={projectTitle} />
          ) : undefined
        }
      />
      <BoardFilterModal
        open={filtersOpen}
        priority={priority}
        selectedAssigneeIds={selectedAssigneeIds}
        includeUnassigned={includeUnassigned}
        selectedLabelIds={selectedLabelIds}
        members={board.members}
        labels={board.labels}
        onClose={() => setFiltersOpen(false)}
        onPriorityChange={setPriority}
        onAssigneeToggle={(memberId) => setSelectedAssigneeIds((current) => toggleAssigneeFilter(current, memberId))}
        onUnassignedToggle={() => setIncludeUnassigned((current) => !current)}
        onClearAssignees={() => {
          setSelectedAssigneeIds([])
          setIncludeUnassigned(false)
        }}
        onLabelToggle={(labelId) => setSelectedLabelIds((current) => toggleLabelFilter(current, labelId))}
        onClearLabels={() => setSelectedLabelIds([])}
        onClearAll={() => {
          setPriority("all")
          setSelectedAssigneeIds([])
          setIncludeUnassigned(false)
          setSelectedLabelIds([])
        }}
      />
      <p className="sr-only" role="status" aria-live="polite">
        {isSaving ? "Saving board movement" : (error ?? "")}
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
          collisionDetection={boardCollisionDetection}
          onDragStart={({ active }) => {
            if (canManage && beginListDrag(active.id)) return
            if (!canEdit || !locateTask(board, active.id)) return
            useBoardStore.getState().setError(null)
            beginPreview(board)
            setActiveDrag({ taskId: String(active.id), initialBoard: board })
          }}
          onDragOver={({ active, over }) => {
            if (over && previewListDrag(active.id, over.id)) return
            if (!canEdit || !over) return
            previewAtTarget(active.id, over.id, active.rect.current.translated?.top, over.rect.top, over.rect.height)
          }}
          onDragEnd={({ active, over }) => {
            if (activeListId) {
              if (over) void commitListDrag(active.id, over.id)
              else cancelListDrag()
              return
            }
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
            finishPreview()
            setActiveDrag(null)
            void commitTaskMove(String(active.id), initialBoard)
          }}
          onDragCancel={() => {
            if (cancelListDrag()) return
            if (activeDrag) cancelTaskMove(activeDrag.initialBoard)
            cancelScheduledPreview()
            finishPreview()
            setActiveDrag(null)
          }}
        >
          <ScrollArea orientation="horizontal" className="flex items-start gap-4 px-1 pb-4 pt-5">
            <SortableContext items={listIds.map((id) => `list-sort:${id}`)} strategy={horizontalListSortingStrategy}>
              {visibleLists.map((list) => {
                const originalList = board.lists.find((candidate) => candidate.id === list.id)
                if (!originalList) return null
                return (
                  <DroppableBoardColumnController
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
            </SortableContext>
            {canManage && <CreateListController projectId={projectId} />}
          </ScrollArea>
          <DragOverlay>
            {activeListOverlay ? (
              <div className="pointer-events-none scale-[1.01] opacity-95 drop-shadow-[0_20px_28px_rgb(0_0_0/0.55)]">
                <BoardColumn
                  list={activeListOverlay}
                  totalTasks={board.lists.find((list) => list.id === activeListOverlay.id)?.tasks.length ?? 0}
                  isDropTarget
                  dropRef={() => undefined}
                >
                  <div className="space-y-3">
                    {activeListOverlay.tasks.map((task) => (
                      <TaskCardController
                        key={task.id}
                        task={task}
                        canEdit={false}
                        onEdit={() => undefined}
                        isOverlay
                      />
                    ))}
                  </div>
                </BoardColumn>
              </div>
            ) : overlayLocation?.task ? (
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
