import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentProjects } from "@/components/dashboard/recent-projects"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import { WorkspaceEmptyState } from "@/components/workspaces/workspace-empty-state"
import { CreateProjectController } from "@/controllers/projects/create-project.controller"
import { getDashboardSummary } from "@/features/projects/queries/get-dashboard-summary"
import { getActiveWorkspaceContext } from "@/features/workspaces/queries/get-active-workspace-context"
import { canCreateProjectInWorkspace } from "@/features/workspaces/workspace.policy"

export default async function DashboardPage() {
  const { activeWorkspace } = await getActiveWorkspaceContext()
  if (!activeWorkspace) return <WorkspaceEmptyState />
  const summary = await getDashboardSummary(activeWorkspace.id)
  const creationWorkspace = canCreateProjectInWorkspace(activeWorkspace) ? activeWorkspace : null

  return (
    <div className="space-y-6">
      <TechFrameCard
        className="min-h-0 w-full"
        contentClassName="min-h-0 gap-0 px-[clamp(2.5rem,5vw,6rem)] py-6 sm:min-h-0 sm:px-[clamp(2.5rem,5vw,6rem)] sm:py-8"
      >
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-bold text-3xl text-white">{activeWorkspace.name}</h1>
            <p className="mt-2 text-cyan-100/70">Workspace dashboard and accessible project overview.</p>
          </div>
          <CreateProjectController workspace={creationWorkspace} />
        </header>
      </TechFrameCard>
      <DashboardStats
        projectCount={summary.projectCount}
        memberCount={summary.memberCount}
        taskCount={summary.taskCount}
        workspaceMemberCount={activeWorkspace.memberCount}
      />
      <RecentProjects projects={summary.recentProjects} workspaces={[activeWorkspace]} />
    </div>
  )
}
