"use client"

import { useActionState } from "react"

import { deleteListAction, renameListAction, reorderListsAction } from "@/features/board/actions/board.actions"
import type { BoardListDto } from "@/features/board/board.types"
import { ListControls } from "@/features/board/components/list-controls"
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
