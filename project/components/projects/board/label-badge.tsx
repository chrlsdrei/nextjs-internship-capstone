import type { LabelDto } from "@/features/labels/label.types"
import { labelColorStyle } from "@/features/labels/label-color"
import { cn } from "@/lib/utils"

export function LabelBadge({ label, className }: { label: LabelDto; className?: string }) {
  return (
    <span
      className={cn("inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-xs font-semibold", className)}
      style={labelColorStyle(label.color)}
      title={label.name}
    >
      <span className="truncate">{label.name}</span>
    </span>
  )
}
