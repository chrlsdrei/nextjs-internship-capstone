"use client"

import { useId } from "react"

import { ActionFeedback } from "@/components/ui/action-feedback"
import { Modal } from "@/components/ui/modal"
import type { ActionState } from "@/lib/action-state"

type LeaveBoardDialogProps = {
  projectId: string
  projectTitle: string
  action: (payload: FormData) => void
  pending: boolean
  state: ActionState
  onClose: () => void
}

export function LeaveBoardDialog({ projectId, projectTitle, action, pending, state, onClose }: LeaveBoardDialogProps) {
  const formId = useId()

  return (
    <Modal
      open
      onClose={onClose}
      title="Leave board"
      description={`Remove your access to ${projectTitle}.`}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-lg px-4 py-2 text-cyan-100/75 hover:bg-white/10 hover:text-white disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={pending}
            className="rounded-lg border border-red-400/60 bg-red-950/45 px-4 py-2 font-semibold text-red-200 hover:bg-red-900/55 disabled:opacity-60"
          >
            {pending ? "Leaving…" : "Leave board"}
          </button>
        </div>
      }
    >
      <form id={formId} action={action}>
        <input type="hidden" name="projectId" value={projectId} />
        <p className="text-cyan-50">
          You will lose access to this board and be unassigned from its tasks. Your workspace membership will not be
          changed.
        </p>
        <p className="mt-3 text-cyan-100/65 text-sm">A board administrator can invite you back later.</p>
        <ActionFeedback state={state} />
      </form>
    </Modal>
  )
}
