import { Plus } from "lucide-react"

import { ActionFeedback } from "@/components/ui/action-feedback"
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
      <ActionFeedback state={state} />
    </form>
  )
}
