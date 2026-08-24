import { ActionFeedback } from "@/components/ui/action-feedback"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import type { ActionState } from "@/lib/action-state"

type CreateWorkspaceFormProps = {
  action: (payload: FormData) => void
  pending: boolean
  state: ActionState<{ workspaceId: string }>
}

export function CreateWorkspaceForm({ action, pending, state }: CreateWorkspaceFormProps) {
  return (
    <TechFrameCard
      className="min-h-0 w-full"
      contentClassName="min-h-0 gap-0 px-[clamp(2.5rem,5vw,6rem)] py-7 sm:min-h-0 sm:px-[clamp(2.5rem,5vw,6rem)] sm:py-10"
    >
      <form action={action}>
        <div className="space-y-5">
          <label className="block font-medium text-cyan-50 text-sm">
            Workspace name
            <input
              name="name"
              required
              maxLength={100}
              placeholder="Product team"
              className="mt-2 w-full rounded-lg border border-cyan-300/30 bg-blue-950/65 px-3 py-2 text-white placeholder:text-cyan-100/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
            />
          </label>
          <label className="block font-medium text-cyan-50 text-sm">
            Description <span className="font-normal text-cyan-100/60">(optional)</span>
            <textarea
              name="description"
              maxLength={500}
              rows={4}
              placeholder="What will your team organize here?"
              className="mt-2 w-full rounded-lg border border-cyan-300/30 bg-blue-950/65 px-3 py-2 text-white placeholder:text-cyan-100/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
            />
          </label>
        </div>
        <ActionFeedback state={state} />
        <button
          type="submit"
          disabled={pending}
          className="mt-6 rounded-lg bg-cyan-500 px-4 py-2 font-medium text-blue-950 hover:bg-cyan-300 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create workspace"}
        </button>
      </form>
    </TechFrameCard>
  )
}
