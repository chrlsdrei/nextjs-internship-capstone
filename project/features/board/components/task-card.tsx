import { Calendar } from "lucide-react"
import { TaskFrame } from "@/components/ui/task-frame"
import { AssigneeIdentities } from "@/features/assignments/components/assignee-identities"
import type { BoardTaskDto } from "@/features/board/board.types"
import { LabelBadge } from "@/features/labels/components/label-badge"
import { cn } from "@/lib/utils"

type TaskCardProps = {
  task: BoardTaskDto
  isDragging?: boolean
  isOverlay?: boolean
}

export function TaskCard({ task, isDragging = false, isOverlay = false }: TaskCardProps) {
  const priorityClass = {
    low: "border-slate-500/60 bg-slate-700/70 text-slate-100",
    medium: "border-cyan-500/60 bg-cyan-950/70 text-cyan-100",
    high: "border-red-500/60 bg-red-950/70 text-red-100",
  }[task.priority]
  return (
    <article>
      <TaskFrame
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
      </TaskFrame>
    </article>
  )
}
