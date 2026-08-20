"use server"

import { refreshWorkspace, workspaceActionError } from "@/features/workspaces/actions/workspace-action-support"
import { updateWorkspaceSettings } from "@/features/workspaces/services/workspace.service"
import type { ActionState } from "@/lib/action-state"
import { actionSuccess } from "@/lib/action-state"

export async function updateWorkspaceSettingsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const workspaceId = String(formData.get("workspaceId") ?? "")
  try {
    await updateWorkspaceSettings(workspaceId, {
      membersCanCreateProjects: formData.get("membersCanCreateProjects") === "true",
    })
    refreshWorkspace(workspaceId)
    return actionSuccess(undefined, "Workspace settings saved.")
  } catch (error) {
    return workspaceActionError(error)
  }
}
