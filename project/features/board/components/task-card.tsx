import { Calendar, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import type { ReactNode } from "react"

import { AssigneeIdentities } from "@/features/assignments/components/assignee-identities"
import type { BoardListDto, BoardTaskDto } from "@/features/board/board.types"
import { LabelBadge } from "@/features/labels/components/label-badge"
import type { ActionState } from "@/lib/action-state"

type TaskCardProps = {
  task: BoardTaskDto
  lists: BoardListDto[]
  listId: string
  taskIds: string[]
  index: number
  canDelete: boolean
  canEdit: boolean
  onEdit: () => void
  dragHandle?: ReactNode
  moveAction: (payload: FormData) => void
  deleteAction: (payload: FormData) => void
  reorderAction: (payload: FormData) => void
  moving: boolean
  deleting: boolean
  reordering: boolean
  error: string | null
  projectId: string
}

export function TaskCard({
  projectId,
  task,
  lists,
  listId,
  taskIds,
  index,
  canDelete,
  canEdit,
  onEdit,
  dragHandle,
  moveAction,
  deleteAction,
  reorderAction,
  moving,
  deleting,
  reordering,
  error,
}: TaskCardProps) {
  const priorityClass = {
    low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    medium: "bg-blue-munsell-100 text-blue-munsell-700 dark:bg-blue-munsell-900 dark:text-blue-munsell-200",
    high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
  }[task.priority]
  const orderAfterSwap = (otherIndex: number) => {
    const next = [...taskIds]
    ;[next[index], next[otherIndex]] = [next[otherIndex], next[index]]
    return JSON.stringify(next)
  }

  return (
    <article className="rounded-lg border border-french-gray-300 bg-white p-4 shadow-sm dark:border-paynes-gray-400 dark:bg-outer-space-300">
      <div className="flex items-start gap-2">
        {dragHandle}
        <button
          type="button"
          onClick={onEdit}
          disabled={!canEdit}
          className="min-w-0 flex-1 text-left focus:outline-none focus:ring-2 focus:ring-blue-munsell-500 disabled:cursor-default"
        >
          <h4 className="font-medium text-outer-space-500 dark:text-platinum-500">{task.title}</h4>
          {task.description && (
            <p className="mt-2 line-clamp-3 text-paynes-gray-500 text-sm dark:text-french-gray-400">
              {task.description}
            </p>
          )}
        </button>
      </div>
      {task.labels.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Task labels">
          {task.labels.map((label) => (
            <li key={label.id}>
              <LabelBadge label={label} />
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={`rounded-full px-2 py-1 font-medium capitalize ${priorityClass}`}>{task.priority}</span>
        {task.dueDate && (
          <span className="inline-flex items-center gap-1 text-paynes-gray-500 dark:text-french-gray-400">
            <Calendar size={14} />
            {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(task.dueDate))}
          </span>
        )}
        <AssigneeIdentities assignees={task.assignees} />
      </div>
      {canEdit && (
        <div className="mt-3 flex items-center gap-2 border-french-gray-300 border-t pt-3 dark:border-paynes-gray-400">
          <form action={reorderAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="listId" value={listId} />
            <input
              type="hidden"
              name="taskIds"
              value={index > 0 ? orderAfterSwap(index - 1) : JSON.stringify(taskIds)}
            />
            <button
              type="submit"
              disabled={index === 0 || reordering}
              className="rounded p-1 hover:bg-platinum-500 disabled:opacity-40"
              aria-label="Move task up"
            >
              <ChevronUp size={16} />
            </button>
          </form>
          <form action={reorderAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="listId" value={listId} />
            <input
              type="hidden"
              name="taskIds"
              value={index < taskIds.length - 1 ? orderAfterSwap(index + 1) : JSON.stringify(taskIds)}
            />
            <button
              type="submit"
              disabled={index === taskIds.length - 1 || reordering}
              className="rounded p-1 hover:bg-platinum-500 disabled:opacity-40"
              aria-label="Move task down"
            >
              <ChevronDown size={16} />
            </button>
          </form>
          <form action={moveAction} className="ml-auto flex items-center gap-1">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="taskId" value={task.id} />
            <select
              name="listId"
              defaultValue=""
              aria-label="Move task to another list"
              className="max-w-28 rounded border border-french-gray-300 bg-white px-1 py-1 text-xs dark:border-paynes-gray-400 dark:bg-outer-space-400"
            >
              <option value="" disabled>
                Move to…
              </option>
              {lists
                .filter((list) => list.id !== listId)
                .map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
            </select>
            <button type="submit" disabled={moving} className="text-blue-munsell-600 text-xs disabled:opacity-50">
              Move
            </button>
          </form>
          {canDelete && (
            <form action={deleteAction}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="taskId" value={task.id} />
              <button
                type="submit"
                disabled={deleting}
                className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                aria-label="Delete task"
              >
                <Trash2 size={16} />
              </button>
            </form>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-red-600 text-xs">
          {error}
        </p>
      )}
    </article>
  )
}

export function actionStateError(...states: ActionState[]) {
  return states.find((state) => state.status === "error")?.message ?? null
}
