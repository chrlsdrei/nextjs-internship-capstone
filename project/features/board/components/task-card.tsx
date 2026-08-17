import { Calendar, ChevronDown, ChevronUp, Trash2 } from "lucide-react"

import { AssigneeIdentities } from "@/features/assignments/components/assignee-identities"
import type { BoardListDto, BoardTaskDto } from "@/features/board/board.types"
import { OrnamentalFrame } from "@/features/board/components/ornamental-frame"
import { LabelBadge } from "@/features/labels/components/label-badge"
import type { ActionState } from "@/lib/action-state"
import { cn } from "@/lib/utils"

type TaskCardProps = {
  task: BoardTaskDto
  lists: BoardListDto[]
  listId: string
  taskIds: string[]
  index: number
  canDelete: boolean
  canEdit: boolean
  onEdit: () => void
  isDragging?: boolean
  isOverlay?: boolean
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
  isDragging = false,
  isOverlay = false,
  moveAction,
  deleteAction,
  reorderAction,
  moving,
  deleting,
  reordering,
  error,
}: TaskCardProps) {
  const priorityClass = {
    low: "border-slate-500/60 bg-slate-700/70 text-slate-100",
    medium: "border-cyan-500/60 bg-cyan-950/70 text-cyan-100",
    high: "border-red-500/60 bg-red-950/70 text-red-100",
  }[task.priority]
  const orderAfterSwap = (otherIndex: number) => {
    const next = [...taskIds]
    ;[next[index], next[otherIndex]] = [next[otherIndex], next[index]]
    return JSON.stringify(next)
  }

  return (
    <article>
      <OrnamentalFrame
        variant="task"
        className={cn(
          isDragging && "opacity-35",
          isOverlay &&
            "shadow-[inset_0_0_0_2px_var(--ornament-edge-bright),inset_0_0_32px_var(--ornament-depth),0_16px_32px_rgb(0_0_0/0.55),0_0_14px_var(--ornament-glow)]",
        )}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1 text-left">
            <h4 className="font-medium text-[var(--ornament-foreground)] tracking-wide">{task.title}</h4>
            {task.description && (
              <p className="mt-2 line-clamp-3 text-[var(--ornament-muted)] text-sm">{task.description}</p>
            )}
          </div>
        </div>
        {task.labels.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Task labels">
            {task.labels.map((label) => (
              <li key={label.id}>
                <LabelBadge label={label} className="ring-1 ring-white/20" />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className={`rounded-full border px-2 py-1 font-medium capitalize ${priorityClass}`}>
            {task.priority}
          </span>
          {task.dueDate && (
            <span className="inline-flex items-center gap-1 text-[var(--ornament-muted)]">
              <Calendar size={14} />
              {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(task.dueDate))}
            </span>
          )}
          <AssigneeIdentities assignees={task.assignees} />
        </div>
        {canEdit && (
          <fieldset
            aria-label="Task actions"
            className="mt-3 flex flex-wrap items-center gap-2 border-[var(--ornament-edge-dark)] border-t pt-3"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
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
                className="rounded-sm p-1 text-[var(--ornament-muted)] hover:bg-white/10 hover:text-[var(--ornament-foreground)] disabled:opacity-40"
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
                className="rounded-sm p-1 text-[var(--ornament-muted)] hover:bg-white/10 hover:text-[var(--ornament-foreground)] disabled:opacity-40"
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
                className="max-w-28 rounded-sm border border-[var(--ornament-edge-bright)] bg-[var(--ornament-depth)] px-1 py-1 text-[var(--ornament-foreground)] text-xs"
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
              <button
                type="submit"
                disabled={moving}
                className="text-[var(--ornament-accent)] text-xs disabled:opacity-50"
              >
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
                  className="rounded-sm p-1 text-red-300 hover:bg-red-950/70 disabled:opacity-50"
                  aria-label="Delete task"
                >
                  <Trash2 size={16} />
                </button>
              </form>
            )}
          </fieldset>
        )}
        {error && (
          <p role="alert" className="mt-2 text-red-300 text-xs">
            {error}
          </p>
        )}
      </OrnamentalFrame>
    </article>
  )
}

export function actionStateError(...states: ActionState[]) {
  return states.find((state) => state.status === "error")?.message ?? null
}
