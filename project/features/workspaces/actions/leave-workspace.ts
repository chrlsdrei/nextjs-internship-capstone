"use server"

import { redirect } from "next/navigation"

import { refreshWorkspace, workspaceActionError } from "@/features/workspaces/actions/workspace-action-support"
import { leaveWorkspace } from "@/features/workspaces/services/workspace.service"
import type { ActionState } from "@/lib/action-state"

export async function leaveWorkspaceAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const workspaceId = String(formData.get("workspaceId") ?? "")
  try {
    await leaveWorkspace(workspaceId)
    refreshWorkspace(workspaceId)
  } catch (error) {
    return workspaceActionError(error)
  }

  redirect("/workspaces")
}
