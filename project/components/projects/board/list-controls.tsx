"use client"

import { MoreHorizontal, Trash2 } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"

import { ActionFeedback } from "@/components/ui/action-feedback"
import type { BoardListDto } from "@/features/board/board.types"
import type { ActionState } from "@/lib/action-state"

type ListControlsProps = {
  projectId: string
  list: BoardListDto
  listIds: string[]
  index: number
  renameAction: (payload: FormData) => void
  deleteAction: (payload: FormData) => void
  reorderAction: (payload: FormData) => void
  renameState: ActionState
  deleteState: ActionState
  reorderState: ActionState
  renaming: boolean
  deleting: boolean
  reordering: boolean
}

export function ListControls({
  projectId,
  list,
  listIds,
  index,
  renameAction,
  deleteAction,
  reorderAction,
  renameState,
  deleteState,
  reorderState,
  renaming,
  deleting,
  reordering,
}: ListControlsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const menuId = useId()
  const moveList = (target: number) => {
    const next = [...listIds]
    ;[next[index], next[target]] = [next[target], next[index]]
    return JSON.stringify(next)
  }
  const feedbackState =
    [renameState, deleteState, reorderState].find((state) => state.status === "error") ??
    [renameState, deleteState, reorderState].find((state) => state.status === "success") ??
    renameState

  useEffect(() => {
    if (!isOpen) return
    titleInputRef.current?.focus()
    const dismissOnOutsidePointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("pointerdown", dismissOnOutsidePointer)
    document.addEventListener("keydown", dismissOnEscape)
    return () => {
      document.removeEventListener("pointerdown", dismissOnOutsidePointer)
      document.removeEventListener("keydown", dismissOnEscape)
    }
  }, [isOpen])

  useEffect(() => {
    if (renameState.status === "success" || deleteState.status === "success" || reorderState.status === "success") {
      setIsOpen(false)
    }
  }, [deleteState.status, renameState.status, reorderState.status])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={`Manage ${list.name}`}
        aria-expanded={isOpen}
        aria-controls={menuId}
        className="rounded-sm p-1 text-[var(--ornament-muted)] transition hover:bg-white/10 hover:text-[var(--ornament-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ornament-accent)]"
      >
        <MoreHorizontal size={18} />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="dialog"
          aria-label={`List actions for ${list.name}`}
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-sm border border-[var(--ornament-edge-bright)] bg-[var(--ornament-surface)] p-3 text-left text-[var(--ornament-foreground)] shadow-[inset_0_0_18px_var(--ornament-depth),0_12px_28px_rgb(0_0_0/0.55),0_0_8px_var(--ornament-glow)]"
        >
          <form action={renameAction} className="space-y-2">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="listId" value={list.id} />
            <label className="block text-[var(--ornament-muted)] text-xs">
              List title
              <input
                name="name"
                defaultValue={list.name}
                maxLength={100}
                required
                ref={titleInputRef}
                className="mt-1 w-full rounded-sm border border-[var(--ornament-edge-bright)] bg-[var(--ornament-depth)] px-2 py-1.5 text-[var(--ornament-foreground)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ornament-accent)]"
                aria-label={`Rename ${list.name}`}
              />
            </label>
            <button
              type="submit"
              disabled={renaming}
              className="w-full rounded-sm border border-[var(--ornament-edge-bright)] px-2 py-1.5 text-sm transition hover:border-[var(--ornament-accent)] hover:shadow-[0_0_7px_var(--ornament-glow)] disabled:opacity-50"
            >
              {renaming ? "Saving…" : "Save title"}
            </button>
          </form>

          <div className="mt-3 flex items-center gap-2 border-[var(--ornament-edge-dark)] border-t pt-3">
            <form action={reorderAction} className="flex-1">
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="listIds" value={index > 0 ? moveList(index - 1) : JSON.stringify(listIds)} />
              <button
                type="submit"
                disabled={index === 0 || reordering}
                className="w-full rounded-sm border border-[var(--ornament-edge-dark)] px-2 py-1.5 text-xs hover:border-[var(--ornament-edge-bright)] disabled:opacity-40"
                aria-label="Move list left"
              >
                ← Left
              </button>
            </form>
            <form action={reorderAction} className="flex-1">
              <input type="hidden" name="projectId" value={projectId} />
              <input
                type="hidden"
                name="listIds"
                value={index < listIds.length - 1 ? moveList(index + 1) : JSON.stringify(listIds)}
              />
              <button
                type="submit"
                disabled={index === listIds.length - 1 || reordering}
                className="w-full rounded-sm border border-[var(--ornament-edge-dark)] px-2 py-1.5 text-xs hover:border-[var(--ornament-edge-bright)] disabled:opacity-40"
                aria-label="Move list right"
              >
                Right →
              </button>
            </form>
          </div>

          <form action={deleteAction} className="mt-3 border-[var(--ornament-edge-dark)] border-t pt-3">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="listId" value={list.id} />
            <button
              type="submit"
              disabled={deleting}
              className="flex w-full items-center justify-center gap-2 rounded-sm border border-red-700/70 px-2 py-1.5 text-red-300 text-sm hover:bg-red-950/60 disabled:opacity-50"
              aria-label={`Delete ${list.name}`}
            >
              <Trash2 size={15} /> {deleting ? "Deleting…" : "Delete list"}
            </button>
          </form>
          <ActionFeedback state={feedbackState} />
        </div>
      )}
    </div>
  )
}
