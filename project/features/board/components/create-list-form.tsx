import { Plus } from "lucide-react"

import { ActionFeedback } from "@/components/ui/action-feedback"
import { OrnamentalFrame } from "@/components/ui/ornamental-frame"
import type { ActionState } from "@/lib/action-state"

export function CreateListForm({
  projectId,
  formAction,
  state,
  isPending,
}: {
  projectId: string
  formAction: (payload: FormData) => void
  state: ActionState
  isPending: boolean
}) {
  return (
    <OrnamentalFrame className="min-w-72" contentClassName="px-1 py-1">
      <form action={formAction} className="flex flex-col gap-3">
        <label className="font-medium text-[var(--ornament-foreground)] text-sm">
          New list
          <input
            name="name"
            required
            maxLength={100}
            placeholder="e.g. To do"
            className="mt-1 w-full rounded-sm border border-[var(--ornament-edge-bright)] bg-[var(--ornament-depth)] px-3 py-2 text-[var(--ornament-foreground)] placeholder:text-[var(--ornament-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ornament-accent)]"
          />
        </label>
        <input type="hidden" name="projectId" value={projectId} />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-1 rounded-sm border border-[var(--ornament-accent)] bg-[color-mix(in_srgb,var(--ornament-accent)_65%,var(--ornament-depth))] px-3 py-2 text-[var(--ornament-foreground)] text-sm shadow-[0_0_8px_var(--ornament-glow)] hover:bg-[var(--ornament-accent)] hover:text-[var(--ornament-depth)] disabled:opacity-60"
        >
          <Plus size={16} /> {isPending ? "Adding…" : "Add list"}
        </button>
        <ActionFeedback state={state} />
      </form>
    </OrnamentalFrame>
  )
}
