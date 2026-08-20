"use server"

import { refreshWorkspace, workspaceActionError } from "@/features/workspaces/actions/workspace-action-support"
import { updateWorkspaceDetails } from "@/features/workspaces/services/workspace.service"
import type { ActionState } from "@/lib/action-state"
import { actionSuccess } from "@/lib/action-state"

export async function updateWorkspaceDetailsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const workspaceId = String(formData.get("workspaceId") ?? "")
  try {
    await updateWorkspaceDetails(workspaceId, { name: formData.get("name"), description: formData.get("description") })
    refreshWorkspace(workspaceId)
    return actionSuccess(undefined, "Workspace details saved.")
  } catch (error) {
    return workspaceActionError(error)
  }
}
