"use client"

import { useRouter } from "next/navigation"
import { useActionState, useEffect } from "react"

import { createLabelAction, deleteLabelAction, updateLabelAction } from "@/features/labels/actions/label.actions"
import { LabelPalette } from "@/features/labels/components/label-palette"
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
