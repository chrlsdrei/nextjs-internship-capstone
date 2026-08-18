"use client"

import { Trash2, X } from "lucide-react"
import { type ReactNode, useEffect, useId, useRef } from "react"
import { createPortal } from "react-dom"

import { OrnamentalFrame } from "@/components/ui/ornamental-frame"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  deleteAction?: (payload: FormData) => void
  deleteState: ActionState
  isDeleting: boolean
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

const fieldClass =
  "mt-1.5 w-full rounded-sm border border-[var(--ornament-edge-bright)] bg-[var(--ornament-depth)] px-3 py-2.5 text-[var(--ornament-foreground)] placeholder:text-[var(--ornament-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ornament-accent)] disabled:cursor-not-allowed disabled:opacity-60"

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
  deleteAction,
  deleteState,
  isDeleting,
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
  const taskFormId = useId()
  const deleteFormId = task ? `delete-task-${task.id}` : undefined
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    if (canEditTask) titleInputRef.current?.focus()
    else closeButtonRef.current?.focus()

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current()
    }
    window.addEventListener("keydown", closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [canEditTask])

  const dialog = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6">
      <button
        type="button"
        aria-label="Close task dialog"
        className="absolute inset-0 cursor-default bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <OrnamentalFrame
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-dialog-title"
        className="h-[calc(100dvh-1rem)] w-full max-w-2xl shadow-[inset_0_0_0_2px_var(--ornament-edge-dark),inset_0_0_36px_var(--ornament-depth),0_24px_70px_rgb(0_0_0/0.7),0_0_18px_var(--ornament-glow)] sm:h-[min(44rem,calc(100dvh-3rem))]"
        contentClassName="flex min-h-0 flex-col overflow-hidden px-2 sm:px-4"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-[var(--ornament-edge-bright)] border-b px-1 pb-4">
          <div>
            <h2 id="task-dialog-title" className="font-semibold text-[var(--ornament-foreground)] text-xl">
              {isEditing ? (canEditTask ? "Edit task" : "Task details") : "Create task"}
            </h2>
            <p className="mt-1 text-[var(--ornament-muted)] text-sm">
              {isEditing ? "Review task details, collaboration, and activity." : "Add a card to this project board."}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-sm p-1.5 text-[var(--ornament-muted)] hover:bg-white/10 hover:text-[var(--ornament-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ornament-accent)]"
            aria-label="Close task form"
          >
            <X size={20} />
          </button>
        </header>

        {task && deleteAction && (
          <form id={deleteFormId} action={deleteAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="taskId" value={task.id} />
          </form>
        )}

        <ScrollArea className="min-h-0 flex-1 px-1 py-5 sm:px-2">
          <form id={taskFormId} action={formAction} onSubmit={onSubmit} className="space-y-5">
            <input type="hidden" name="projectId" value={projectId} />
            {task ? (
              <input type="hidden" name="taskId" value={task.id} />
            ) : (
              <input type="hidden" name="listId" value={listId} />
            )}

            <label className="block font-medium text-[var(--ornament-foreground)] text-sm">
              Title
              <input
                ref={titleInputRef}
                name="title"
                required
                maxLength={200}
                defaultValue={task?.title}
                disabled={!canEditTask}
                className={fieldClass}
              />
            </label>

            <label className="block font-medium text-[var(--ornament-foreground)] text-sm">
              Description
              <textarea
                name="description"
                rows={4}
                maxLength={1000}
                defaultValue={task?.description ?? ""}
                disabled={!canEditTask}
                className={`${fieldClass} resize-y`}
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block font-medium text-[var(--ornament-foreground)] text-sm">
                Priority
                <select
                  name="priority"
                  defaultValue={task?.priority ?? "medium"}
                  disabled={!canEditTask}
                  className={fieldClass}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label className="block font-medium text-[var(--ornament-foreground)] text-sm">
                Due date
                <input
                  name="dueDate"
                  type="date"
                  defaultValue={task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""}
                  disabled={!canEditTask}
                  className={fieldClass}
                />
              </label>
            </div>

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
                <p className="font-medium text-[var(--ornament-foreground)]">Assignees</p>
                <div className="mt-2 rounded-sm border border-[var(--ornament-edge-dark)] bg-[var(--ornament-depth)] px-3 py-2 text-[var(--ornament-muted)]">
                  {task?.assignees.length ? (
                    <div className="flex items-center gap-3">
                      <AssigneeIdentities assignees={task.assignees} limit={5} />
                      <span>{task.assignees.map((assignee) => assignee.name).join(", ")}</span>
                    </div>
                  ) : (
                    "Unassigned"
                  )}
                </div>
                <p className="mt-1 text-[var(--ornament-muted)] text-xs">
                  You do not have permission to change task assignments.
                </p>
              </div>
            )}

            <fieldset>
              <legend className="font-medium text-[var(--ornament-foreground)] text-sm">Labels</legend>
              <input type="hidden" name="labelIds" value={JSON.stringify(selectedLabelIds)} />
              {labels.length === 0 ? (
                <p className="mt-2 rounded-sm border border-[var(--ornament-edge-bright)] border-dashed bg-[var(--ornament-depth)] p-3 text-[var(--ornament-muted)] text-sm">
                  No labels are available. A board administrator can create the project’s label palette below.
                </p>
              ) : (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {labels.map((label) => {
                    const selected = selectedLabelIds.includes(label.id)
                    return (
                      <label
                        key={label.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-sm border p-2 transition ${
                          selected
                            ? "border-[var(--ornament-accent)] bg-cyan-950/55 shadow-[0_0_7px_var(--ornament-glow)]"
                            : "border-[var(--ornament-edge-dark)] bg-[var(--ornament-depth)] hover:border-[var(--ornament-edge-bright)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={!canEditTask}
                          onChange={() => onLabelToggle(label.id)}
                          className="size-4 accent-cyan-400"
                        />
                        <LabelBadge label={label} className="min-w-0" />
                      </label>
                    )
                  })}
                </div>
              )}
            </fieldset>

            {state.status === "error" && (
              <p role="alert" className="rounded-sm border border-red-500/40 bg-red-950/45 p-3 text-red-200 text-sm">
                {state.message}
              </p>
            )}
          </form>

          {deleteState.status === "error" && (
            <p role="alert" className="mt-3 rounded-sm border border-red-500/40 bg-red-950/45 p-3 text-red-200 text-sm">
              {deleteState.message}
            </p>
          )}
          {labelPalette && <div className="mt-7 border-[var(--ornament-edge-dark)] border-t pt-6">{labelPalette}</div>}
          {comments && <div className="mt-7">{comments}</div>}
        </ScrollArea>

        <footer className="flex shrink-0 flex-wrap items-center gap-3 border-[var(--ornament-edge-bright)] border-t px-1 pt-4">
          {task && deleteAction && (
            <button
              type="submit"
              form={deleteFormId}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 rounded-sm border border-red-500/45 bg-red-950/40 px-4 py-2 text-red-200 hover:bg-red-900/60 disabled:opacity-60"
            >
              <Trash2 aria-hidden="true" size={16} /> {isDeleting ? "Deleting…" : "Delete task"}
            </button>
          )}
          <div className="ml-auto flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm px-4 py-2 text-[var(--ornament-muted)] hover:bg-white/10 hover:text-[var(--ornament-foreground)]"
            >
              {canEditTask ? "Cancel" : "Close"}
            </button>
            {canEditTask && (
              <button
                type="submit"
                form={taskFormId}
                disabled={isPending}
                className="rounded-sm border border-[var(--ornament-accent)] bg-[color-mix(in_srgb,var(--ornament-accent)_70%,var(--ornament-depth))] px-4 py-2 font-medium text-[var(--ornament-foreground)] shadow-[0_0_8px_var(--ornament-glow)] hover:bg-[var(--ornament-accent)] hover:text-[var(--ornament-depth)] disabled:opacity-60"
              >
                {isPending ? "Saving…" : isEditing ? "Save task" : "Create task"}
              </button>
            )}
          </div>
        </footer>
      </OrnamentalFrame>
    </div>
  )

  return createPortal(dialog, document.body)
}
