import { X } from "lucide-react"
import type { ReactNode } from "react"

import { AssigneeIdentities } from "@/features/assignments/components/assignee-identities"
import { AssigneeMultiSelect } from "@/features/assignments/components/assignee-multi-select"
import type { BoardMemberDto, BoardTaskDto } from "@/features/board/board.types"
import { LabelBadge } from "@/features/labels/components/label-badge"
import type { LabelDto } from "@/features/labels/label.types"
import type { ActionState } from "@/lib/action-state"

type TaskDialogProps = {
  projectId: string
  listId?: string
  members: BoardMemberDto[]
  task?: BoardTaskDto
  onClose: () => void
  formAction: (payload: FormData) => void
  onSubmit: () => void
  state: ActionState
  isPending: boolean
  canEditTask: boolean
  canAssignTasks: boolean
  labels: LabelDto[]
  selectedLabelIds: string[]
  onLabelToggle: (labelId: string) => void
  selectedAssigneeIds: string[]
  assigneeSearch: string
  onAssigneeSearchChange: (value: string) => void
  onAssigneeToggle: (memberId: string) => void
  onAssigneeClear: () => void
  labelPalette?: ReactNode
  comments?: ReactNode
}

export function TaskDialog({
  projectId,
  listId,
  members,
  task,
  onClose,
  formAction,
  onSubmit,
  state,
  isPending,
  canEditTask,
  canAssignTasks,
  labels,
  selectedLabelIds,
  onLabelToggle,
  selectedAssigneeIds,
  assigneeSearch,
  onAssigneeSearchChange,
  onAssigneeToggle,
  onAssigneeClear,
  labelPalette,
  comments,
}: TaskDialogProps) {
  const isEditing = Boolean(task)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-dialog-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-outer-space-500">
        <div className="flex items-center justify-between gap-4">
          <h2 id="task-dialog-title" className="text-lg font-semibold text-outer-space-500 dark:text-platinum-500">
            {isEditing ? (canEditTask ? "Edit task" : "Task details") : "Create task"}
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
        <form action={formAction} onSubmit={onSubmit} className="mt-5 space-y-4">
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
              disabled={!canEditTask}
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
              disabled={!canEditTask}
              className="mt-1 w-full rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
            />
          </label>
          <label className="block text-sm font-medium">
            Priority
            <select
              name="priority"
              defaultValue={task?.priority ?? "medium"}
              disabled={!canEditTask}
              className="mt-1 w-full rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          {canAssignTasks ? (
            <AssigneeMultiSelect
              members={members}
              selectedIds={selectedAssigneeIds}
              search={assigneeSearch}
              onSearchChange={onAssigneeSearchChange}
              onToggle={onAssigneeToggle}
              onClear={onAssigneeClear}
            />
          ) : (
            <div className="text-sm">
              <p className="font-medium">Assignees</p>
              <div className="mt-2 rounded border border-french-gray-300 bg-platinum-700 px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400">
                {task?.assignees.length ? (
                  <div className="flex items-center gap-3">
                    <AssigneeIdentities assignees={task.assignees} limit={5} />
                    <span>{task.assignees.map((assignee) => assignee.name).join(", ")}</span>
                  </div>
                ) : (
                  "Unassigned"
                )}
              </div>
              <p className="mt-1 text-paynes-gray-500 text-xs dark:text-french-gray-400">
                You do not have permission to change task assignments.
              </p>
            </div>
          )}
          <label className="block text-sm font-medium">
            Due date
            <input
              name="dueDate"
              type="date"
              defaultValue={task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""}
              disabled={!canEditTask}
              className="mt-1 w-full rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
            />
          </label>
          <fieldset>
            <legend className="text-sm font-medium">Labels</legend>
            <input type="hidden" name="labelIds" value={JSON.stringify(selectedLabelIds)} />
            {labels.length === 0 ? (
              <p className="mt-2 rounded border border-dashed border-french-gray-300 p-3 text-paynes-gray-500 text-sm dark:border-paynes-gray-400 dark:text-french-gray-400">
                No labels are available. A board administrator can create the project’s label palette.
              </p>
            ) : (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {labels.map((label) => {
                  const selected = selectedLabelIds.includes(label.id)
                  return (
                    <label
                      key={label.id}
                      className="flex cursor-pointer items-center gap-2 rounded border border-french-gray-300 p-2 dark:border-paynes-gray-400"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={!canEditTask}
                        onChange={() => onLabelToggle(label.id)}
                        className="size-4 accent-blue-munsell-500"
                      />
                      <LabelBadge label={label} className="min-w-0" />
                    </label>
                  )
                })}
              </div>
            )}
          </fieldset>
          {state.status === "error" && (
            <p role="alert" className="text-sm text-red-600">
              {state.message}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded px-4 py-2 hover:bg-platinum-500">
              {canEditTask ? "Cancel" : "Close"}
            </button>
            {canEditTask && (
              <button
                type="submit"
                disabled={isPending}
                className="rounded bg-blue-munsell-500 px-4 py-2 text-white disabled:opacity-60"
              >
                {isPending ? "Saving…" : isEditing ? "Save task" : "Create task"}
              </button>
            )}
          </div>
        </form>
        {labelPalette && <div className="mt-6">{labelPalette}</div>}
        {comments && <div className="mt-6">{comments}</div>}
      </div>
    </div>
  )
}
