import { TeamDirectoryController } from "@/controllers/team/team-directory.controller"
import { listWorkspaceTeamDetails } from "@/features/workspaces/queries/list-workspace-team-details"

export default async function TeamPage() {
  const workspaces = await listWorkspaceTeamDetails()

  return <TeamDirectoryController initialWorkspaces={workspaces} />
}
