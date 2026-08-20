"use client"

import { useRouter } from "next/navigation"
import { useActionState, useEffect } from "react"
import { CreateWorkspaceForm } from "@/components/workspaces/create-workspace-form"
import { createWorkspaceAction } from "@/features/workspaces/actions/create-workspace"
import type { ActionState } from "@/lib/action-state"

const initialState: ActionState<{ workspaceId: string }> = { status: "idle" }

export function CreateWorkspaceController() {
  const router = useRouter()
  const [state, action, pending] = useActionState(createWorkspaceAction, initialState)

  useEffect(() => {
    if (state.status === "success" && state.data?.workspaceId) {
      router.push(`/workspaces/${state.data.workspaceId}`)
    }
  }, [router, state])

  return <CreateWorkspaceForm action={action} pending={pending} state={state} />
}
