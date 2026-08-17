import type * as React from "react"

import { cn } from "@/lib/utils"

type ScrollAreaProps = React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical" | "both"
}

const overflowClass = {
  horizontal: "overflow-x-auto overflow-y-hidden",
  vertical: "overflow-x-hidden overflow-y-auto",
  both: "overflow-auto",
} as const

export function ScrollArea({ orientation = "vertical", className, ...props }: ScrollAreaProps) {
  return (
    <div
      data-slot="scroll-area"
      data-orientation={orientation}
      className={cn("themed-scrollbar", overflowClass[orientation], className)}
      {...props}
    />
  )
}
