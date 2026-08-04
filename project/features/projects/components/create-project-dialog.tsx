"use client"

import { X } from "lucide-react"
import { ActionFeedback } from "@/components/ui/action-feedback"
import type { ActionState } from "@/lib/action-state"

type CreateProjectDialogProps = {
  action: (payload: FormData) => void
  isPending: boolean
  onClose: () => void
  state: ActionState
}

export function CreateProjectDialog({ action, isPending, onClose, state }: CreateProjectDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-outer-space-500">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="create-project-title" className="font-semibold text-lg text-outer-space-500 dark:text-platinum-500">
            Create new project
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-platinum-500 dark:hover:bg-paynes-gray-400"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <form action={action} className="space-y-4">
          <label className="block font-medium text-sm text-outer-space-500 dark:text-platinum-500">
            Project name
            <input
              name="name"
              required
              maxLength={100}
              className="mt-2 w-full rounded-lg border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
            />
          </label>
          <label className="block font-medium text-sm text-outer-space-500 dark:text-platinum-500">
            Description
            <textarea
              name="description"
              maxLength={500}
              rows={3}
              className="mt-2 w-full rounded-lg border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
            />
          </label>
          <label className="block font-medium text-sm text-outer-space-500 dark:text-platinum-500">
            Due date
            <input
              name="dueDate"
              type="date"
              className="mt-2 w-full rounded-lg border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
            />
          </label>
          <ActionFeedback state={state} />
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 hover:bg-platinum-500 dark:hover:bg-paynes-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-munsell-500 px-4 py-2 text-white hover:bg-blue-munsell-600 disabled:opacity-60"
            >
              {isPending ? "Creating…" : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
