import "server-only"

import { listWorkspaceTeamDetails as listWorkspaceTeamDetailsService } from "@/features/workspaces/services/workspace.service"

export async function listWorkspaceTeamDetails(
  ...args: Parameters<typeof listWorkspaceTeamDetailsService>
): Promise<Awaited<ReturnType<typeof listWorkspaceTeamDetailsService>>> {
  return listWorkspaceTeamDetailsService(...args)
}
