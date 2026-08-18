"use client"

import { ActionFeedback } from "@/components/ui/action-feedback"
import { Modal } from "@/components/ui/modal"
import type { ActionState } from "@/lib/action-state"

export function BuildAiDialog({
  open,
  onClose,
  onSubmit,
  pending,
  state,
  workspaces,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (formData: FormData) => void
  pending: boolean
  state: ActionState<unknown>
  workspaces: Array<{ id: string; name: string }>
}) {
  const input =
    "mt-2 w-full rounded-lg border border-cyan-300/35 bg-blue-950/75 px-3 py-2.5 text-white [color-scheme:dark] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Build with AI"
      description="Describe your goal and Gemini will create the project, columns, and tasks immediately."
      className="max-w-2xl"
    >
      <form action={onSubmit} className="space-y-4">
        <label className="block font-medium text-sm">
          Workspace
          <select name="workspaceId" required defaultValue="" className={input}>
            <option value="" disabled>
              Select a workspace
            </option>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block font-medium text-sm">
          Project title
          <input name="title" required maxLength={200} className={input} />
        </label>
        <label className="block font-medium text-sm">
          Goal and requirements
          <textarea name="goal" required minLength={10} maxLength={4000} rows={6} className={input} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block font-medium text-sm">
            Columns
            <select name="listCount" defaultValue="3" className={input}>
              {[1, 2, 3].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="block font-medium text-sm">
            Total tasks
            <select name="taskCount" defaultValue="9" className={input}>
              {Array.from({ length: 15 }, (_, index) => index + 1).map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="block font-medium text-sm">
          Project due date (optional)
          <input name="dueDate" type="date" className={input} />
        </label>
        <p className="text-cyan-100/60 text-xs">
          Project details are sent to Gemini. Secrets, member emails, comments, and attachments are never included.
        </p>
        <ActionFeedback state={state} />
        <div className="flex justify-end gap-3 border-cyan-300/20 border-t pt-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-cyan-100/75">
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-blue-950 disabled:opacity-50"
          >
            {pending ? "Building…" : "Build project"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
