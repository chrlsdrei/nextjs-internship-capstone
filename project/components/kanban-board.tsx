"use client"

import { DndContext, KeyboardSensor, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Filter, GripVertical, Plus, Search, Trash2 } from "lucide-react"
import { useActionState, useEffect, useMemo, useState } from "react"

import {
  createListAction,
  deleteListAction,
  initialBoardActionState,
  renameListAction,
  reorderListsAction,
} from "@/app/(dashboard)/projects/[id]/board-actions"
import { useProjectEvents } from "@/hooks/use-project-events"
import { useTasks } from "@/hooks/use-tasks"
import type { BoardList, BoardTask, ProjectBoard } from "@/lib/db/queries/board"
import { useBoardStore } from "@/stores/board-store"

import { CreateTaskModal } from "./modals/create-task-modal"
import { TaskCard } from "./task-card"

function Feedback({ error, success }: { error?: string | null; success?: boolean }) {
  if (error)
    return (
      <p role="alert" className="mt-2 text-sm text-red-600">
        {error}
      </p>
    )
  if (success)
    return (
      <p role="status" className="mt-2 text-sm text-green-600">
        Saved.
      </p>
    )
  return null
}

function ListControls({
  projectId,
  list,
  listIds,
  index,
}: {
  projectId: string
  list: BoardList
  listIds: string[]
  index: number
}) {
  const [renameState, renameAction, renaming] = useActionState(renameListAction, initialBoardActionState)
  const [deleteState, deleteAction, deleting] = useActionState(deleteListAction, initialBoardActionState)
  const [reorderState, reorderAction, reordering] = useActionState(reorderListsAction, initialBoardActionState)
  const moveList = (target: number) => {
    const next = [...listIds]
    ;[next[index], next[target]] = [next[target], next[index]]
    return JSON.stringify(next)
  }

  return (
    <div className="space-y-2">
      <form action={renameAction} className="flex gap-2">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="listId" value={list.id} />
        <input
          name="name"
          defaultValue={list.name}
          maxLength={100}
          required
          className="min-w-0 flex-1 rounded border border-french-gray-300 bg-white px-2 py-1 text-sm dark:border-paynes-gray-400 dark:bg-outer-space-400"
          aria-label={`Rename ${list.name}`}
        />
        <button type="submit" disabled={renaming} className="text-xs text-blue-munsell-600 disabled:opacity-50">
          Save
        </button>
      </form>
      <div className="flex items-center gap-2 text-xs">
        <form action={reorderAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="listIds" value={index > 0 ? moveList(index - 1) : JSON.stringify(listIds)} />
          <button
            type="submit"
            disabled={index === 0 || reordering}
            className="rounded px-2 py-1 hover:bg-platinum-500 disabled:opacity-40"
            aria-label="Move list left"
          >
            ←
          </button>
        </form>
        <form action={reorderAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <input
            type="hidden"
            name="listIds"
            value={index < listIds.length - 1 ? moveList(index + 1) : JSON.stringify(listIds)}
          />
          <button
            type="submit"
            disabled={index === listIds.length - 1 || reordering}
            className="rounded px-2 py-1 hover:bg-platinum-500 disabled:opacity-40"
            aria-label="Move list right"
          >
            →
          </button>
        </form>
        <form action={deleteAction} className="ml-auto">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="listId" value={list.id} />
          <button
            type="submit"
            disabled={deleting}
            className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
            aria-label={`Delete ${list.name}`}
          >
            <Trash2 size={15} />
          </button>
        </form>
      </div>
      <Feedback
        error={renameState.error || deleteState.error || reorderState.error}
        success={renameState.success || deleteState.success || reorderState.success}
      />
    </div>
  )
}

function CreateListForm({ projectId }: { projectId: string }) {
  const [state, formAction, isPending] = useActionState(createListAction, initialBoardActionState)
  return (
    <form
      action={formAction}
      className="flex min-w-72 flex-col gap-2 rounded-lg border border-dashed border-french-gray-300 p-4 dark:border-paynes-gray-400"
    >
      <label className="text-sm font-medium">
        New list
        <input
          name="name"
          required
          maxLength={100}
          placeholder="e.g. To do"
          className="mt-1 w-full rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
        />
      </label>
      <input type="hidden" name="projectId" value={projectId} />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center gap-1 rounded bg-blue-munsell-500 px-3 py-2 text-sm text-white disabled:opacity-60"
      >
        <Plus size={16} /> {isPending ? "Adding…" : "Add list"}
      </button>
      <Feedback error={state.error} success={state.success} />
    </form>
  )
}

function SortableTask({
  task,
  ...props
}: Omit<Parameters<typeof TaskCard>[0], "task" | "dragHandle"> & { task: BoardTask }) {
  const sortable = useSortable({ id: task.id })
  return (
    <div
      ref={sortable.setNodeRef}
      style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}
      className={sortable.isDragging ? "opacity-40" : undefined}
    >
      <TaskCard
        {...props}
        task={task}
        dragHandle={
          <button
            type="button"
            className="rounded p-1 text-paynes-gray-500 hover:bg-platinum-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-munsell-500"
            aria-label={`Drag ${task.title}`}
            {...sortable.attributes}
            {...sortable.listeners}
          >
            <GripVertical size={16} />
          </button>
        }
      />
    </div>
  )
}

function TaskDropZone({ list, children }: { list: BoardList; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `list:${list.id}` })
  return (
    <div
      ref={setNodeRef}
      className={`mt-3 min-h-24 space-y-3 rounded transition-colors ${isOver ? "bg-blue-munsell-50/60 dark:bg-blue-munsell-900/20" : ""}`}
    >
      {children}
    </div>
  )
}

export function KanbanBoard({ projectId, board: serverBoard }: { projectId: string; board: ProjectBoard }) {
  const [search, setSearch] = useState("")
  const [priority, setPriority] = useState<"all" | BoardTask["priority"]>("all")
  const [assigneeId, setAssigneeId] = useState("all")
  const [createListId, setCreateListId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<BoardTask | null>(null)
  const storedProjectId = useBoardStore((state) => state.projectId)
  const storedBoard = useBoardStore((state) => state.board)
  const board = storedProjectId === projectId && storedBoard ? storedBoard : serverBoard
  const setBoard = useBoardStore((state) => state.setBoard)
  const { moveTask, isSaving, error } = useTasks(projectId, board)
  useProjectEvents(projectId)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => setBoard(projectId, serverBoard), [projectId, serverBoard, setBoard])

  const canManage = board.role === "owner" || board.role === "admin"
  const listIds = board.lists.map((list) => list.id)
  const visibleLists = useMemo(() => {
    const term = search.trim().toLowerCase()
    return board.lists.map((list) => ({
      ...list,
      tasks: list.tasks.filter(
        (task) =>
          (!term || task.title.toLowerCase().includes(term) || task.description?.toLowerCase().includes(term)) &&
          (priority === "all" || task.priority === priority) &&
          (assigneeId === "all" || (assigneeId === "unassigned" ? !task.assignee : task.assignee?.id === assigneeId)),
      ),
    }))
  }, [assigneeId, board.lists, priority, search])

  return (
    <section aria-label="Project board" className="space-y-4">
      <div className="grid gap-3 rounded-lg border border-french-gray-300 bg-white p-4 sm:grid-cols-3 dark:border-paynes-gray-400 dark:bg-outer-space-500">
        <label className="relative sm:col-span-1">
          <span className="sr-only">Search tasks</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-paynes-gray-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks"
            className="w-full rounded border border-french-gray-300 bg-white py-2 pl-9 pr-3 dark:border-paynes-gray-400 dark:bg-outer-space-400"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Filter size={16} />
          <span className="sr-only">Filter priority</span>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as typeof priority)}
            className="min-w-0 flex-1 rounded border border-french-gray-300 bg-white px-2 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="sr-only">Filter assignee</span>
          <select
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
            className="w-full rounded border border-french-gray-300 bg-white px-2 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
          >
            <option value="all">All assignees</option>
            <option value="unassigned">Unassigned</option>
            {board.members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
      </div>
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
              <CreateListForm projectId={projectId} />
            </div>
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragEnd={({ active, over }) => {
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
              const originalList = board.lists.find((candidate) => candidate.id === list.id) as BoardList
              return (
                <section
                  key={list.id}
                  className="w-[min(20rem,calc(100vw-2rem))] shrink-0 rounded-lg border border-french-gray-300 bg-platinum-800 p-3 dark:border-paynes-gray-400 dark:bg-outer-space-400"
                >
                  <div className="border-b border-french-gray-300 pb-3 dark:border-paynes-gray-400">
                    {canManage ? (
                      <ListControls
                        projectId={projectId}
                        list={originalList}
                        listIds={listIds}
                        index={listIds.indexOf(list.id)}
                      />
                    ) : (
                      <h2 className="font-semibold text-outer-space-500 dark:text-platinum-500">{list.name}</h2>
                    )}
                    <p className="mt-1 text-xs text-paynes-gray-500 dark:text-french-gray-400">
                      {list.tasks.length} shown · {originalList.tasks.length} total
                    </p>
                  </div>
                  <TaskDropZone list={originalList}>
                    <SortableContext items={list.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                      {list.tasks.map((task) => (
                        <SortableTask
                          key={task.id}
                          projectId={projectId}
                          task={task}
                          lists={board.lists}
                          listId={list.id}
                          taskIds={originalList.tasks.map((item) => item.id)}
                          index={originalList.tasks.findIndex((item) => item.id === task.id)}
                          canDelete={canManage}
                          onEdit={() => setEditingTask(task)}
                        />
                      ))}
                    </SortableContext>
                    {list.tasks.length === 0 && (
                      <p className="rounded border border-dashed border-french-gray-300 p-4 text-center text-sm text-paynes-gray-500 dark:border-paynes-gray-400 dark:text-french-gray-400">
                        Drop a task here.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setCreateListId(list.id)}
                      className="w-full rounded border-2 border-dashed border-french-gray-300 p-2 text-sm text-paynes-gray-500 hover:border-blue-munsell-500 hover:text-blue-munsell-600 dark:border-paynes-gray-400"
                    >
                      + Add task
                    </button>
                  </TaskDropZone>
                </section>
              )
            })}
            {canManage && <CreateListForm projectId={projectId} />}
          </div>
        </DndContext>
      )}
      {createListId && (
        <CreateTaskModal
          projectId={projectId}
          listId={createListId}
          members={board.members}
          onClose={() => setCreateListId(null)}
        />
      )}
      {editingTask && (
        <CreateTaskModal
          projectId={projectId}
          members={board.members}
          task={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </section>
  )
}
