"use server"

import { cookies } from "next/headers"
import { refreshWorkspace, workspaceActionError } from "@/features/workspaces/actions/workspace-action-support"
import { ACTIVE_WORKSPACE_COOKIE, ACTIVE_WORKSPACE_COOKIE_MAX_AGE } from "@/features/workspaces/active-workspace"
import { createWorkspace } from "@/features/workspaces/services/workspace.service"
import type { ActionState } from "@/lib/action-state"
import { actionSuccess } from "@/lib/action-state"

export async function createWorkspaceAction(
  _: ActionState<{ workspaceId: string }>,
  formData: FormData,
): Promise<ActionState<{ workspaceId: string }>> {
  try {
    const workspace = await createWorkspace({ name: formData.get("name"), description: formData.get("description") })
    const cookieStore = await cookies()
    cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspace.id, {
      httpOnly: true,
      maxAge: ACTIVE_WORKSPACE_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
    refreshWorkspace(workspace.id)
    return actionSuccess({ workspaceId: workspace.id }, "Workspace created.")
  } catch (error) {
    return workspaceActionError<{ workspaceId: string }>(error)
  }
}
