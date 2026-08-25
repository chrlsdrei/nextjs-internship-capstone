"use client"

import { useId } from "react"

import { ActionFeedback } from "@/components/ui/action-feedback"
import { Modal } from "@/components/ui/modal"
import type { WorkspaceSummaryDto } from "@/features/workspaces/workspace.types"
import type { ActionState } from "@/lib/action-state"

type CreateProjectDialogProps = {
  action: (payload: FormData) => void
  isPending: boolean
  onClose: () => void
  state: ActionState
  workspace: WorkspaceSummaryDto
}

export function CreateProjectDialog({ action, isPending, onClose, state, workspace }: CreateProjectDialogProps) {
  const formId = useId()

  return (
    <Modal
      open
      onClose={onClose}
      title="Create new project"
      description={`Create this project in ${workspace.name}.`}
      className="max-w-2xl"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-cyan-100/75 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isPending}
            className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-blue-950 hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Creating…" : "Create project"}
          </button>
        </div>
      }
    >
      <form id={formId} action={action} className="space-y-5">
        <input type="hidden" name="workspaceId" value={workspace.id} />
        <div className="rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-4 py-3">
          <p className="text-cyan-100/55 text-xs uppercase tracking-wider">Active workspace</p>
          <p className="mt-1 font-semibold text-white">{workspace.name}</p>
        </div>
        <label className="block font-medium text-cyan-50 text-sm">
          Project title
          <input
            name="title"
            required
            maxLength={100}
            className="mt-2 w-full rounded-lg border border-cyan-300/35 bg-blue-950/75 px-3 py-2.5 text-white placeholder:text-cyan-100/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          />
        </label>
        <label className="block font-medium text-cyan-50 text-sm">
          Description
          <textarea
            name="description"
            maxLength={500}
            rows={4}
            className="mt-2 w-full resize-y rounded-lg border border-cyan-300/35 bg-blue-950/75 px-3 py-2.5 text-white placeholder:text-cyan-100/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          />
        </label>
        <label className="block font-medium text-cyan-50 text-sm">
          Due date
          <input
            name="dueDate"
            type="date"
            className="mt-2 w-full rounded-lg border border-cyan-300/35 bg-blue-950/75 px-3 py-2.5 text-white [color-scheme:dark] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          />
        </label>
        <ActionFeedback state={state} />
      </form>
    </Modal>
  )
}
