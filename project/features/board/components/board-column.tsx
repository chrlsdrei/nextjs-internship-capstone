import type { ReactNode } from "react"

import { OrnamentalFrame } from "@/components/ui/ornamental-frame"
import type { BoardListDto } from "@/features/board/board.types"

export function BoardColumn({
  list,
  totalTasks,
  actions,
  children,
  addTask,
  isDropTarget,
  dropRef,
}: {
  list: BoardListDto
  totalTasks: number
  actions?: ReactNode
  children: ReactNode
  addTask?: () => void
  isDropTarget: boolean
  dropRef: (element: HTMLDivElement | null) => void
}) {
  return (
    <section className="w-[min(20rem,calc(100vw-2rem))] shrink-0 self-start" aria-label={`${list.name} list`}>
      <OrnamentalFrame
        variant="column"
        title={list.name}
        actions={actions}
        isHighlighted={isDropTarget}
        contentClassName="flex flex-col"
      >
        <p className="mb-2 px-2 text-[0.7rem] text-[var(--ornament-muted)] tracking-wide">
          {list.tasks.length} shown · {totalTasks} total
        </p>
        <div ref={dropRef} className="min-h-24 space-y-3 rounded-sm px-1 py-2">
          {children}
          {list.tasks.length === 0 && (
            <p className="rounded-sm border border-[var(--ornament-edge-bright)] border-dashed bg-[color-mix(in_srgb,var(--ornament-depth)_52%,transparent)] p-4 text-center text-sm text-[var(--ornament-muted)]">
              Drop a task here.
            </p>
          )}
        </div>
        {addTask && (
          <div className="mt-2 border-[var(--ornament-edge-dark)] border-t px-1 pt-3">
            <button
              type="button"
              onClick={addTask}
              className="w-full rounded-sm border border-[var(--ornament-edge-bright)] border-dashed bg-[color-mix(in_srgb,var(--ornament-depth)_36%,transparent)] p-2 text-sm text-[var(--ornament-muted)] transition hover:border-[var(--ornament-accent)] hover:text-[var(--ornament-foreground)] hover:shadow-[0_0_9px_var(--ornament-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ornament-accent)]"
            >
              + Add task
            </button>
          </div>
        )}
      </OrnamentalFrame>
    </section>
  )
}
