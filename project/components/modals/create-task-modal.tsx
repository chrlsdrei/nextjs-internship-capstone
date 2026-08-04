"use client"

import { X } from "lucide-react"
import { useActionState, useEffect } from "react"

import {
  createTaskAction,
  initialBoardActionState,
  updateTaskAction,
} from "@/app/(dashboard)/projects/[id]/board-actions"
import type { BoardMember, BoardTask } from "@/lib/db/queries/board"

type TaskModalProps = {
  projectId: string
  listId?: string
  members: BoardMember[]
  task?: BoardTask
  onClose: () => void
}

export function CreateTaskModal({ projectId, listId, members, task, onClose }: TaskModalProps) {
  const isEditing = Boolean(task)
  const [state, formAction, isPending] = useActionState(
    isEditing ? updateTaskAction : createTaskAction,
    initialBoardActionState,
  )

  useEffect(() => {
    if (state.success) onClose()
  }, [onClose, state.success])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-outer-space-500">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-outer-space-500 dark:text-platinum-500">
            {isEditing ? "Edit task" : "Create task"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-platinum-500"
            aria-label="Close task form"
          >
            <X size={20} />
          </button>
        </div>
        <form action={formAction} className="mt-5 space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          {task ? (
            <input type="hidden" name="taskId" value={task.id} />
          ) : (
            <input type="hidden" name="listId" value={listId} />
          )}
          <label className="block text-sm font-medium">
            Title
            <input
              name="title"
              required
              maxLength={200}
              defaultValue={task?.title}
              className="mt-1 w-full rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
            />
          </label>
          <label className="block text-sm font-medium">
            Description
            <textarea
              name="description"
              rows={4}
              maxLength={1000}
              defaultValue={task?.description ?? ""}
              className="mt-1 w-full rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Priority
              <select
                name="priority"
                defaultValue={task?.priority ?? "medium"}
                className="mt-1 w-full rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Assignee
              <select
                name="assigneeId"
                defaultValue={task?.assignee?.id ?? ""}
                className="mt-1 w-full rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium">
            Due date
            <input
              name="dueDate"
              type="date"
              defaultValue={task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""}
              className="mt-1 w-full rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
            />
          </label>
          {state.error && (
            <p role="alert" className="text-sm text-red-600">
              {state.error}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded px-4 py-2 hover:bg-platinum-500">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-blue-munsell-500 px-4 py-2 text-white disabled:opacity-60"
            >
              {isPending ? "Saving…" : isEditing ? "Save task" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
