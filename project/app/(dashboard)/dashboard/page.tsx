import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentProjects } from "@/components/dashboard/recent-projects"
import { WorkspaceDashboardPanel } from "@/components/dashboard/workspace-dashboard-panel"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import { CreateProjectController } from "@/controllers/projects/create-project.controller"
import { getDashboardSummary } from "@/features/projects/queries/get-dashboard-summary"
import { listWorkspaces } from "@/features/workspaces/queries/list-workspaces"
import { canCreateProjectInWorkspace } from "@/features/workspaces/workspace.policy"

export default async function DashboardPage() {
  const [summary, workspaces] = await Promise.all([getDashboardSummary(), listWorkspaces()])

  return (
    <div className="space-y-6">
      <TechFrameCard
        className="min-h-0 w-full"
        contentClassName="min-h-0 gap-0 px-[clamp(2.5rem,5vw,6rem)] py-6 sm:min-h-0 sm:px-[clamp(2.5rem,5vw,6rem)] sm:py-8"
      >
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-bold text-3xl text-white">Dashboard</h1>
            <p className="mt-2 text-cyan-100/70">An overview of the projects you can access.</p>
          </div>
          <CreateProjectController workspaces={workspaces.filter(canCreateProjectInWorkspace)} />
        </header>
      </TechFrameCard>
      <DashboardStats
        projectCount={summary.projectCount}
        memberCount={summary.memberCount}
        taskCount={summary.taskCount}
        workspaceCount={workspaces.length}
      />
      <WorkspaceDashboardPanel workspaces={workspaces} />
      <RecentProjects projects={summary.recentProjects} workspaces={workspaces} />
    </div>
  )
}
