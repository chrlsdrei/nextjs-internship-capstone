"use client"

import { useRouter } from "next/navigation"
import { useActionState, useEffect } from "react"
import { LabelPalette } from "@/components/projects/board/label-palette"
import { createLabelAction } from "@/features/labels/actions/create-label"
import { deleteLabelAction } from "@/features/labels/actions/delete-label"
import { updateLabelAction } from "@/features/labels/actions/update-label"
import type { LabelDto } from "@/features/labels/label.types"
import { initialActionState } from "@/lib/action-state"

export function LabelPaletteController({ projectId, labels }: { projectId: string; labels: LabelDto[] }) {
  const router = useRouter()
  const [createState, createAction, creating] = useActionState(createLabelAction, initialActionState)
  const [updateState, updateAction, updating] = useActionState(updateLabelAction, initialActionState)
  const [deleteState, deleteAction, deleting] = useActionState(deleteLabelAction, initialActionState)

  useEffect(() => {
    if ([createState, updateState, deleteState].some((state) => state.status === "success")) router.refresh()
  }, [createState, deleteState, router, updateState])

  return (
    <LabelPalette
      projectId={projectId}
      labels={labels}
      createAction={createAction}
      updateAction={updateAction}
      deleteAction={deleteAction}
      createState={createState}
      updateState={updateState}
      deleteState={deleteState}
      creating={creating}
      updating={updating}
      deleting={deleting}
    />
  )
}
