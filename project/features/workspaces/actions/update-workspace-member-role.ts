"use server"

import { refreshWorkspace, workspaceActionError } from "@/features/workspaces/actions/workspace-action-support"
import { updateWorkspaceMemberRole } from "@/features/workspaces/services/workspace.service"
import type { ActionState } from "@/lib/action-state"
import { actionSuccess } from "@/lib/action-state"

export async function updateWorkspaceMemberRoleAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const workspaceId = String(formData.get("workspaceId") ?? "")
  try {
    await updateWorkspaceMemberRole(workspaceId, { memberId: formData.get("memberId"), role: formData.get("role") })
    refreshWorkspace(workspaceId)
    return actionSuccess(undefined, "Member role updated.")
  } catch (error) {
    return workspaceActionError(error)
  }
}
