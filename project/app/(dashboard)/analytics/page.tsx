import { BarChart3 } from "lucide-react"

import { RealisticFogBackground } from "@/components/ui/realistic-fog-background"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import { AnalyticsDashboard } from "@/features/analytics/components/analytics-dashboard"
import { getAnalyticsDashboard } from "@/features/analytics/server/analytics.service"

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const requestedYear = Number.parseInt((await searchParams).year ?? "", 10)
  const data = await getAnalyticsDashboard(Number.isNaN(requestedYear) ? undefined : requestedYear)

  return (
    <div className="relative isolate -mx-4 -my-8 min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-8 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <RealisticFogBackground className="fixed inset-0 -z-20" />
      <div className="relative z-10 mx-auto max-w-[112rem] space-y-6">
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
              <p className="mt-1 text-cyan-100/70">Track real project progress, completions, and team activity.</p>
            </div>
          </header>
        </TechFrameCard>
        <AnalyticsDashboard data={data} />
      </div>
    </div>
  )
}
