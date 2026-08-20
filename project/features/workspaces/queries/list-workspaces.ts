import "server-only"

import { listWorkspaces as listWorkspacesService } from "@/features/workspaces/services/workspace.service"

export async function listWorkspaces(
  ...args: Parameters<typeof listWorkspacesService>
): Promise<Awaited<ReturnType<typeof listWorkspacesService>>> {
  return listWorkspacesService(...args)
}
