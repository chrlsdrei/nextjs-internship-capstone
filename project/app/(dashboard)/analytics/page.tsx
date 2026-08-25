import { BarChart3 } from "lucide-react"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import { WorkspaceEmptyState } from "@/components/workspaces/workspace-empty-state"
import { getAnalyticsDashboard } from "@/features/analytics/queries/get-analytics-dashboard"
import { getActiveWorkspaceContext } from "@/features/workspaces/queries/get-active-workspace-context"

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const requestedYear = Number.parseInt((await searchParams).year ?? "", 10)
  const { activeWorkspace } = await getActiveWorkspaceContext()
  if (!activeWorkspace) return <WorkspaceEmptyState />
  const data = await getAnalyticsDashboard(Number.isNaN(requestedYear) ? undefined : requestedYear, activeWorkspace.id)

  return (
    <div className="mx-auto max-w-[112rem] space-y-6">
      <TechFrameCard
        className="min-h-0 w-full"
        contentClassName="min-h-0 gap-0 px-[clamp(2.5rem,5vw,6rem)] py-6 sm:min-h-0 sm:px-[clamp(2.5rem,5vw,6rem)] sm:py-8"
      >
        <header className="flex items-center gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 ring-1 ring-cyan-300/25">
            <BarChart3 className="text-cyan-300" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-3xl text-white">Analytics</h1>
            <p className="mt-1 text-cyan-100/70">
              Track progress, completions, and team activity in {activeWorkspace.name}.
            </p>
          </div>
        </header>
      </TechFrameCard>
      <AnalyticsDashboard data={data} />
    </div>
  )
}
