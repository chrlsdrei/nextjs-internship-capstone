"use client"

import { useActionState } from "react"
import { CreateListForm } from "@/components/projects/board/create-list-form"
import { createListAction } from "@/features/board/actions/create-list"
import { initialActionState } from "@/lib/action-state"

export function CreateListController({ projectId }: { projectId: string }) {
  const [state, formAction, isPending] = useActionState(createListAction, initialActionState)
  return <CreateListForm projectId={projectId} formAction={formAction} state={state} isPending={isPending} />
}
