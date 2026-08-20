import { ActionFeedback } from "@/components/ui/action-feedback"
import type { ActionState } from "@/lib/action-state"

type CreateWorkspaceFormProps = {
  action: (payload: FormData) => void
  pending: boolean
  state: ActionState<{ workspaceId: string }>
}

export function CreateWorkspaceForm({ action, pending, state }: CreateWorkspaceFormProps) {
  return (
    <form
      action={action}
      className="rounded-xl border border-french-gray-300 bg-white p-6 dark:border-paynes-gray-400 dark:bg-outer-space-500"
    >
      <div className="space-y-5">
        <label className="block font-medium text-outer-space-500 text-sm dark:text-platinum-500">
          Workspace name
          <input
            name="name"
            required
            maxLength={100}
            placeholder="Product team"
            className="mt-2 w-full rounded-lg border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
          />
        </label>
        <label className="block font-medium text-outer-space-500 text-sm dark:text-platinum-500">
          Description <span className="font-normal text-paynes-gray-500">(optional)</span>
          <textarea
            name="description"
            maxLength={500}
            rows={4}
            placeholder="What will your team organize here?"
            className="mt-2 w-full rounded-lg border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
          />
        </label>
      </div>
      <ActionFeedback state={state} />
      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-lg bg-blue-munsell-500 px-4 py-2 font-medium text-white hover:bg-blue-munsell-600 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create workspace"}
      </button>
    </form>
  )
}
