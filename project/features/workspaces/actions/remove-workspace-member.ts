"use server"

import { refreshWorkspace, workspaceActionError } from "@/features/workspaces/actions/workspace-action-support"
import { removeWorkspaceMember } from "@/features/workspaces/services/workspace.service"
import type { ActionState } from "@/lib/action-state"
import { actionSuccess } from "@/lib/action-state"

export async function removeWorkspaceMemberAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const workspaceId = String(formData.get("workspaceId") ?? "")
  try {
    await removeWorkspaceMember(workspaceId, { memberId: formData.get("memberId") })
    refreshWorkspace(workspaceId)
    return actionSuccess(undefined, "Workspace member removed.")
  } catch (error) {
    return workspaceActionError(error)
  }
}
