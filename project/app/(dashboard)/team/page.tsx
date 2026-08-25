import { WorkspaceEmptyState } from "@/components/workspaces/workspace-empty-state"
import { TeamDirectoryController } from "@/controllers/team/team-directory.controller"
import { getActiveWorkspaceContext } from "@/features/workspaces/queries/get-active-workspace-context"
import { getWorkspaceDetails } from "@/features/workspaces/queries/get-workspace-details"

export default async function TeamPage() {
  const { activeWorkspace } = await getActiveWorkspaceContext()
  if (!activeWorkspace) return <WorkspaceEmptyState />
  const workspace = await getWorkspaceDetails(activeWorkspace.id)

  return <TeamDirectoryController key={activeWorkspace.id} initialWorkspace={workspace} />
}
