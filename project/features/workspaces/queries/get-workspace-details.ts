import "server-only"

import { getWorkspaceDetails as getWorkspaceDetailsService } from "@/features/workspaces/services/workspace.service"
import { WorkspaceAccessError } from "@/features/workspaces/workspace.error"

export { WorkspaceAccessError }
export async function getWorkspaceDetails(
  ...args: Parameters<typeof getWorkspaceDetailsService>
): Promise<Awaited<ReturnType<typeof getWorkspaceDetailsService>>> {
  return getWorkspaceDetailsService(...args)
}
