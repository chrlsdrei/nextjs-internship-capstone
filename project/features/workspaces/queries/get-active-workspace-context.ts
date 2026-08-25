import "server-only"

import { cookies } from "next/headers"
import { cache } from "react"

import { ACTIVE_WORKSPACE_COOKIE, resolveActiveWorkspace } from "@/features/workspaces/active-workspace"
import { listWorkspaces } from "@/features/workspaces/services/workspace.service"

export const getActiveWorkspaceContext = cache(async () => {
  const [cookieStore, workspaces] = await Promise.all([cookies(), listWorkspaces()])
  const requestedId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value
  const activeWorkspace = resolveActiveWorkspace(workspaces, requestedId)

  return { activeWorkspace, workspaces }
})
