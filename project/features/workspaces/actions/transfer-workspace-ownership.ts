"use server"

import { refreshWorkspace, workspaceActionError } from "@/features/workspaces/actions/workspace-action-support"
import { transferWorkspaceOwnershipTo } from "@/features/workspaces/services/workspace.service"
import type { ActionState } from "@/lib/action-state"
import { actionSuccess } from "@/lib/action-state"

export async function transferWorkspaceOwnershipAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const workspaceId = String(formData.get("workspaceId") ?? "")
  try {
    await transferWorkspaceOwnershipTo(workspaceId, { newOwnerMemberId: formData.get("newOwnerMemberId") })
    refreshWorkspace(workspaceId)
    return actionSuccess(undefined, "Workspace ownership transferred.")
  } catch (error) {
    return workspaceActionError(error)
  }
}
