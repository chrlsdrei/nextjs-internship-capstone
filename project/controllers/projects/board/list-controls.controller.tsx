"use client"

import { useActionState } from "react"
import { ListControls } from "@/components/projects/board/list-controls"
import { deleteListAction } from "@/features/board/actions/delete-list"
import { renameListAction } from "@/features/board/actions/rename-list"
import { reorderListsAction } from "@/features/board/actions/reorder-lists"
import type { BoardListDto } from "@/features/board/board.types"
import { initialActionState } from "@/lib/action-state"

export function ListControlsController({
  projectId,
  list,
  listIds,
  index,
}: {
  projectId: string
  list: BoardListDto
  listIds: string[]
  index: number
}) {
  const [renameState, renameAction, renaming] = useActionState(renameListAction, initialActionState)
  const [deleteState, deleteAction, deleting] = useActionState(deleteListAction, initialActionState)
  const [reorderState, reorderAction, reordering] = useActionState(reorderListsAction, initialActionState)

  return (
    <ListControls
      projectId={projectId}
      list={list}
      listIds={listIds}
      index={index}
      renameAction={renameAction}
      deleteAction={deleteAction}
      reorderAction={reorderAction}
      renameState={renameState}
      deleteState={deleteState}
      reorderState={reorderState}
      renaming={renaming}
      deleting={deleting}
      reordering={reordering}
    />
  )
}
