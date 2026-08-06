import { DashboardStats } from "@/features/dashboard/components/dashboard-stats"
import { RecentProjects } from "@/features/dashboard/components/recent-projects"
import { CreateProjectController } from "@/features/projects/controllers/create-project.controller"
import { getDashboardSummary } from "@/features/projects/server/project.service"
import { WorkspaceDashboardPanel } from "@/features/workspaces/components/workspace-dashboard-panel"
import { listWorkspaces } from "@/features/workspaces/server/workspace.service"

export default async function DashboardPage() {
  const [summary, workspaces] = await Promise.all([getDashboardSummary(), listWorkspaces()])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-outer-space-500 dark:text-platinum-500">Dashboard</h1>
          <p className="mt-2 text-paynes-gray-500 dark:text-french-gray-500">
            An overview of the projects you can access.
          </p>
        </div>
        <CreateProjectController />
      </div>
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
