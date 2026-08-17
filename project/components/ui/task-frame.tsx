import type * as React from "react"

import { cn } from "@/lib/utils"

type TaskFrameProps = React.ComponentProps<"div"> & {
  contentClassName?: string
  isHighlighted?: boolean
}

function EdgeHighlights() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <span className="absolute left-8 top-0 h-[3px] w-[32%] rounded-full bg-gradient-to-r from-cyan-300 via-cyan-400 to-transparent shadow-[0_0_9px_var(--ornament-glow)]" />
      <span className="absolute right-8 top-0 h-[3px] w-[24%] rounded-full bg-gradient-to-l from-cyan-300 via-cyan-400 to-transparent shadow-[0_0_9px_var(--ornament-glow)]" />
      <span className="absolute bottom-0 left-8 h-[3px] w-[32%] rounded-full bg-gradient-to-r from-cyan-300 via-cyan-400 to-transparent shadow-[0_0_9px_var(--ornament-glow)]" />
      <span className="absolute right-8 bottom-0 h-[3px] w-[24%] rounded-full bg-gradient-to-l from-cyan-300 via-cyan-400 to-transparent shadow-[0_0_9px_var(--ornament-glow)]" />
      <span className="absolute left-0 top-8 h-[28%] w-[3px] rounded-full bg-gradient-to-b from-cyan-300 via-cyan-400 to-transparent shadow-[0_0_9px_var(--ornament-glow)]" />
      <span className="absolute bottom-8 left-0 h-[24%] w-[3px] rounded-full bg-gradient-to-t from-cyan-300 via-cyan-400 to-transparent shadow-[0_0_9px_var(--ornament-glow)]" />
      <span className="absolute right-0 top-8 h-[28%] w-[3px] rounded-full bg-gradient-to-b from-cyan-300 via-cyan-400 to-transparent shadow-[0_0_9px_var(--ornament-glow)]" />
      <span className="absolute right-0 bottom-8 h-[24%] w-[3px] rounded-full bg-gradient-to-t from-cyan-300 via-cyan-400 to-transparent shadow-[0_0_9px_var(--ornament-glow)]" />
    </div>
  )
}

export function TaskFrame({ className, contentClassName, isHighlighted = false, children, ...props }: TaskFrameProps) {
  return (
    <div
      data-slot="task-frame"
      data-highlighted={isHighlighted || undefined}
      className={cn(
        "group/task-frame relative isolate overflow-hidden rounded-2xl border border-cyan-500/55 bg-[radial-gradient(circle_at_50%_0%,#092b55_0%,var(--ornament-surface)_48%,var(--ornament-depth)_100%)] text-[var(--ornament-foreground)] shadow-[inset_0_0_26px_rgb(0_25_60/0.75),0_8px_20px_rgb(0_5_18/0.45),0_0_8px_rgb(34_211_238/0.28)] transition-[border-color,box-shadow,opacity] duration-200",
        "before:pointer-events-none before:absolute before:inset-1 before:rounded-[calc(1rem-4px)] before:border before:border-cyan-300/35",
        "group-data-[highlighted]/task-frame:border-cyan-300 group-data-[highlighted]/task-frame:shadow-[inset_0_0_28px_rgb(0_35_80/0.8),0_0_16px_var(--ornament-glow)]",
        className,
      )}
      {...props}
    >
      <EdgeHighlights />
      <div className={cn("relative z-10 p-4", contentClassName)}>{children}</div>
    </div>
  )
}
