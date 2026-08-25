"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

import { ACTIVE_WORKSPACE_COOKIE, ACTIVE_WORKSPACE_COOKIE_MAX_AGE } from "@/features/workspaces/active-workspace"
import { getWorkspaceDetails } from "@/features/workspaces/services/workspace.service"
import { workspaceIdSchema } from "@/features/workspaces/workspace.schema"
import type { ActionState } from "@/lib/action-state"
import { actionError, actionSuccess } from "@/lib/action-state"

export async function setActiveWorkspaceAction(workspaceId: string): Promise<ActionState<{ workspaceId: string }>> {
  try {
    const id = workspaceIdSchema.parse(workspaceId)
    await getWorkspaceDetails(id)
    const cookieStore = await cookies()
    cookieStore.set(ACTIVE_WORKSPACE_COOKIE, id, {
      httpOnly: true,
      maxAge: ACTIVE_WORKSPACE_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
    revalidatePath("/", "layout")
    return actionSuccess({ workspaceId: id })
  } catch {
    return actionError("This workspace is no longer available.")
  }
}
