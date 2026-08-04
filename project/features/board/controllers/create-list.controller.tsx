"use client"

import { useActionState } from "react"

import { createListAction } from "@/features/board/actions/board.actions"
import { CreateListForm } from "@/features/board/components/create-list-form"
import { initialActionState } from "@/lib/action-state"

export function CreateListController({ projectId }: { projectId: string }) {
  const [state, formAction, isPending] = useActionState(createListAction, initialActionState)
  return <CreateListForm projectId={projectId} formAction={formAction} state={state} isPending={isPending} />
}
