import { RealisticFogBackground } from "@/components/ui/realistic-fog-background"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import { DashboardStats } from "@/features/dashboard/components/dashboard-stats"
import { RecentProjects } from "@/features/dashboard/components/recent-projects"
import { CreateProjectController } from "@/features/projects/controllers/create-project.controller"
import { getDashboardSummary } from "@/features/projects/server/project.service"
import { WorkspaceDashboardPanel } from "@/features/workspaces/components/workspace-dashboard-panel"
import { listWorkspaces } from "@/features/workspaces/server/workspace.service"
import { canCreateProjectInWorkspace } from "@/features/workspaces/workspace.policy"

export default async function DashboardPage() {
  const [summary, workspaces] = await Promise.all([getDashboardSummary(), listWorkspaces()])

  return (
    <div className="relative isolate -mx-4 -my-8 min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-8 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <RealisticFogBackground />
      <div className="relative z-10 space-y-6">
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
    </div>
  )
}
