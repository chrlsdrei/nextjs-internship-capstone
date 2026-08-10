import { Trash2 } from "lucide-react"

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
  const moveList = (target: number) => {
    const next = [...listIds]
    ;[next[index], next[target]] = [next[target], next[index]]
    return JSON.stringify(next)
  }
  const feedbackState =
    [renameState, deleteState, reorderState].find((state) => state.status === "error") ??
    [renameState, deleteState, reorderState].find((state) => state.status === "success") ??
    renameState

  return (
    <div className="space-y-2">
      <form action={renameAction} className="flex gap-2">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="listId" value={list.id} />
        <input
          name="name"
          defaultValue={list.name}
          maxLength={100}
          required
          className="min-w-0 flex-1 rounded border border-french-gray-300 bg-white px-2 py-1 text-sm dark:border-paynes-gray-400 dark:bg-outer-space-400"
          aria-label={`Rename ${list.name}`}
        />
        <button type="submit" disabled={renaming} className="text-xs text-blue-munsell-600 disabled:opacity-50">
          Save
        </button>
      </form>
      <div className="flex items-center gap-2 text-xs">
        <form action={reorderAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="listIds" value={index > 0 ? moveList(index - 1) : JSON.stringify(listIds)} />
          <button
            type="submit"
            disabled={index === 0 || reordering}
            className="rounded px-2 py-1 hover:bg-platinum-500 disabled:opacity-40"
            aria-label="Move list left"
          >
            ←
          </button>
        </form>
        <form action={reorderAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <input
            type="hidden"
            name="listIds"
            value={index < listIds.length - 1 ? moveList(index + 1) : JSON.stringify(listIds)}
          />
          <button
            type="submit"
            disabled={index === listIds.length - 1 || reordering}
            className="rounded px-2 py-1 hover:bg-platinum-500 disabled:opacity-40"
            aria-label="Move list right"
          >
            →
          </button>
        </form>
        <form action={deleteAction} className="ml-auto">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="listId" value={list.id} />
          <button
            type="submit"
            disabled={deleting}
            className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
            aria-label={`Delete ${list.name}`}
          >
            <Trash2 size={15} />
          </button>
        </form>
      </div>
      <ActionFeedback state={feedbackState} />
    </div>
  )
}
