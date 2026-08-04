import { CreateProjectButton } from "@/components/create-project-button"
import { DashboardStats } from "@/components/dashboard-stats"
import { RecentProjects } from "@/components/recent-projects"
import { getDashboardSummary } from "@/lib/db/queries/projects"

export default async function DashboardPage() {
  const summary = await getDashboardSummary()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-outer-space-500 dark:text-platinum-500">Dashboard</h1>
          <p className="mt-2 text-paynes-gray-500 dark:text-french-gray-500">
            An overview of the projects you can access.
          </p>
        </div>
        <CreateProjectButton />
      </div>
      <DashboardStats
        projectCount={summary.projectCount}
        memberCount={summary.memberCount}
        taskCount={summary.taskCount}
      />
      <RecentProjects projects={summary.recentProjects} />
    </div>
  )
}
