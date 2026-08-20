"use server"

import { refreshWorkspace, workspaceActionError } from "@/features/workspaces/actions/workspace-action-support"
import { createWorkspace } from "@/features/workspaces/services/workspace.service"
import type { ActionState } from "@/lib/action-state"
import { actionSuccess } from "@/lib/action-state"

export async function createWorkspaceAction(
  _: ActionState<{ workspaceId: string }>,
  formData: FormData,
): Promise<ActionState<{ workspaceId: string }>> {
  try {
    const workspace = await createWorkspace({ name: formData.get("name"), description: formData.get("description") })
    refreshWorkspace(workspace.id)
    return actionSuccess({ workspaceId: workspace.id }, "Workspace created.")
  } catch (error) {
    return workspaceActionError<{ workspaceId: string }>(error)
  }
}
