import { RealisticFogBackground } from "@/components/ui/realistic-fog-background"
import { TeamDirectoryController } from "@/controllers/team/team-directory.controller"
import { listWorkspaceTeamDetails } from "@/features/workspaces/queries/list-workspace-team-details"

export default async function TeamPage() {
  const workspaces = await listWorkspaceTeamDetails()

  return (
    <div className="relative isolate -mx-4 -my-8 min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-8 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <RealisticFogBackground />
      <div className="relative z-10">
        <TeamDirectoryController initialWorkspaces={workspaces} />
      </div>
    </div>
  )
}
