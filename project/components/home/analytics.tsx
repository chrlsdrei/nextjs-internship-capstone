import { Activity, BarChart3, CheckCircle2, Users } from "lucide-react"

import { ContributionHeatmap } from "@/components/analytics/contribution-heatmap"

const previewContributions = [
  { date: "2026-01-08", count: 1 },
  { date: "2026-01-15", count: 2 },
  { date: "2026-01-29", count: 1 },
  { date: "2026-02-03", count: 3 },
  { date: "2026-02-12", count: 2 },
  { date: "2026-02-26", count: 4 },
  { date: "2026-03-04", count: 1 },
  { date: "2026-03-11", count: 5 },
  { date: "2026-03-18", count: 2 },
  { date: "2026-03-24", count: 3 },
  { date: "2026-04-02", count: 1 },
  { date: "2026-04-09", count: 4 },
  { date: "2026-04-16", count: 2 },
  { date: "2026-04-23", count: 6 },
  { date: "2026-05-01", count: 3 },
  { date: "2026-05-07", count: 1 },
  { date: "2026-05-14", count: 7 },
  { date: "2026-05-21", count: 4 },
  { date: "2026-05-28", count: 2 },
  { date: "2026-06-04", count: 5 },
  { date: "2026-06-11", count: 3 },
  { date: "2026-06-18", count: 8 },
  { date: "2026-06-25", count: 4 },
  { date: "2026-07-02", count: 2 },
  { date: "2026-07-09", count: 6 },
  { date: "2026-07-16", count: 3 },
  { date: "2026-07-23", count: 9 },
  { date: "2026-07-30", count: 4 },
] as const

const contributionCount = previewContributions.reduce((total, contribution) => total + contribution.count, 0)

const insights = [
  { icon: CheckCircle2, label: "Completion history", detail: "Each finished task becomes a visible contribution." },
  { icon: BarChart3, label: "Project progress", detail: "See completion rates across every accessible project." },
  { icon: Users, label: "Team momentum", detail: "Understand when collaboration and activity are strongest." },
] as const

export function Analytics() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28" aria-labelledby="analytics-heading">
      <div className="mx-auto grid max-w-[94rem] items-center gap-12 xl:grid-cols-[minmax(20rem,0.62fr)_minmax(0,1.38fr)] xl:gap-14">
        <div className="max-w-2xl">
          <p className="font-semibold text-[0.68rem] text-cyan-300 uppercase tracking-[0.24em]">
            03 / Activity analytics
          </p>

          <h2
            id="analytics-heading"
            className="mt-8 text-balance font-bold text-4xl text-white leading-[0.98] tracking-[-0.045em] sm:text-6xl xl:text-7xl"
          >
            See your
            <span className="block bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              momentum.
            </span>
          </h2>

          <p className="mt-7 max-w-xl text-pretty text-base text-cyan-100/70 leading-8 sm:text-lg">
            Activity is more than busyness. QuestBoard turns completed work, project progress, and team activity into a
            clear pulse check for the work that matters.
          </p>

          <div className="mt-9 flex items-end gap-4 border-cyan-300/20 border-b pb-7">
            <Activity aria-hidden="true" className="mb-2 text-cyan-300" size={26} />
            <div>
              <p className="font-bold text-5xl text-cyan-300">{contributionCount}</p>
              <p className="mt-2 text-cyan-100/55 text-sm">sample tasks completed in 2026</p>
            </div>
          </div>

          <div className="mt-7 space-y-5">
            {insights.map((insight) => (
              <div key={insight.label} className="flex items-start gap-3">
                <insight.icon aria-hidden="true" className="mt-0.5 shrink-0 text-cyan-300" size={18} />
                <div>
                  <p className="font-semibold text-sm text-white">{insight.label}</p>
                  <p className="mt-1 text-cyan-100/55 text-sm leading-6">{insight.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <ContributionHeatmap year={2026} availableYears={[2026]} contributions={[...previewContributions]} />
        </div>
      </div>
    </section>
  )
}
