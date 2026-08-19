import { Activity, CheckCircle2, FolderKanban, Gauge, Users } from "lucide-react"

import { TaskFrame } from "@/components/ui/task-frame"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import type { AnalyticsDashboardDto } from "@/features/analytics/analytics.types"
import { ContributionHeatmap } from "@/features/analytics/components/contribution-heatmap"

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  )
}

export function AnalyticsDashboard({ data }: { data: AnalyticsDashboardDto }) {
  const stats = [
    {
      label: "Completed tasks",
      value: data.completedTasks.toLocaleString(),
      detail: `${data.totalTasks.toLocaleString()} total tasks`,
      icon: CheckCircle2,
    },
    { label: "Completion rate", value: `${data.completionRate}%`, detail: "Current board state", icon: Gauge },
    {
      label: "Active contributors",
      value: data.activeContributors.toLocaleString(),
      detail: "Past 30 days",
      icon: Users,
    },
    {
      label: "Accessible projects",
      value: data.projectCount.toLocaleString(),
      detail: `${data.contributionCount} contributions in ${data.year}`,
      icon: FolderKanban,
    },
  ]
  const activityMaximum = Math.max(1, ...data.dailyActivity.map((item) => item.count))

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <TaskFrame key={stat.label} className="h-full" contentClassName="h-full px-7 py-6 sm:px-8 sm:py-7">
            <div className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 ring-1 ring-cyan-300/25">
                <stat.icon className="text-cyan-300" size={21} />
              </div>
              <div>
                <p className="font-semibold text-2xl text-white">{stat.value}</p>
                <p className="font-semibold text-cyan-100/85 text-sm">{stat.label}</p>
                <p className="mt-1 text-cyan-100/55 text-xs">{stat.detail}</p>
              </div>
            </div>
          </TaskFrame>
        ))}
      </div>

      <ContributionHeatmap year={data.year} availableYears={data.availableYears} contributions={data.contributions} />

      <div className="grid gap-6 xl:grid-cols-2">
        <TechFrameCard className="min-h-0" contentClassName="min-h-0 gap-5 px-8 py-8 sm:min-h-0 sm:px-12">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-xl text-white">
              <Gauge className="text-cyan-300" size={21} /> Project progress
            </h2>
            <p className="mt-1 text-cyan-100/60 text-sm">Current task completion by accessible project.</p>
          </div>
          <div className="space-y-5">
            {data.projectProgress.length === 0 ? (
              <p className="rounded-lg border border-dashed border-cyan-300/25 p-6 text-center text-cyan-100/60">
                No accessible projects yet.
              </p>
            ) : (
              data.projectProgress.map((project) => {
                const percentage =
                  project.totalTasks === 0 ? 0 : Math.round((project.completedTasks / project.totalTasks) * 100)
                return (
                  <div key={project.id}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <span className="truncate font-semibold text-cyan-50" title={project.title}>
                        {project.title}
                      </span>
                      <span className="shrink-0 text-cyan-100/65">
                        {project.completedTasks}/{project.totalTasks} · {percentage}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-blue-950 ring-1 ring-cyan-300/15">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-700 to-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.45)]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </TechFrameCard>

        <TechFrameCard className="min-h-0" contentClassName="min-h-0 gap-5 px-8 py-8 sm:min-h-0 sm:px-12">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-xl text-white">
              <Activity className="text-cyan-300" size={21} /> Team activity
            </h2>
            <p className="mt-1 text-cyan-100/60 text-sm">All recorded project activity during the past 14 days.</p>
          </div>
          <div className="flex h-64 items-end gap-2 border-cyan-300/20 border-b px-1 pt-6">
            {data.dailyActivity.map((item, index) => (
              <div key={item.date} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <span className="text-cyan-100/55 text-xs">{item.count || ""}</span>
                <div className="flex h-44 w-full items-end justify-center">
                  <div
                    role="img"
                    aria-label={`${item.count} activities on ${shortDate(item.date)}`}
                    title={`${item.count} activities on ${shortDate(item.date)}`}
                    className="w-full max-w-7 rounded-t bg-gradient-to-t from-blue-700 to-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.25)] transition-[height]"
                    style={{
                      height: item.count === 0 ? "3px" : `${Math.max(8, (item.count / activityMaximum) * 100)}%`,
                    }}
                  />
                </div>
                <span className="h-4 whitespace-nowrap text-[10px] text-cyan-100/45">
                  {index % 2 === 0 ? shortDate(item.date) : ""}
                </span>
              </div>
            ))}
          </div>
        </TechFrameCard>
      </div>
    </div>
  )
}
