import Link from "next/link"

import { ScrollArea } from "@/components/ui/scroll-area"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import type { AnalyticsContributionDto } from "@/features/analytics/analytics.types"
import { cn } from "@/lib/utils"

type ContributionHeatmapProps = {
  year: number
  availableYears: number[]
  contributions: AnalyticsContributionDto[]
}

const monthFormatter = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" })
const fullDateFormatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "UTC" })

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function contributionLevel(count: number) {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

function heatmapWeeks(year: number, contributions: AnalyticsContributionDto[]) {
  const contributionMap = new Map(contributions.map((item) => [item.date, item.count]))
  const firstDay = new Date(Date.UTC(year, 0, 1))
  const lastDay = new Date(Date.UTC(year, 11, 31))
  const gridStart = new Date(firstDay)
  const firstDayOffset = (gridStart.getUTCDay() + 6) % 7
  gridStart.setUTCDate(gridStart.getUTCDate() - firstDayOffset)
  const gridEnd = new Date(lastDay)
  const lastDayOffset = (gridEnd.getUTCDay() + 6) % 7
  gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - lastDayOffset))
  const days: Array<{ date: Date; key: string; count: number; isInYear: boolean }> = []

  for (const cursor = new Date(gridStart); cursor <= gridEnd; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const copy = new Date(cursor)
    const key = dateKey(copy)
    days.push({ date: copy, key, count: contributionMap.get(key) ?? 0, isInYear: copy.getUTCFullYear() === year })
  }

  return Array.from({ length: days.length / 7 }, (_, index) => days.slice(index * 7, index * 7 + 7))
}

const levelClasses = [
  "border-blue-800/45 bg-blue-950/75",
  "border-cyan-800/70 bg-cyan-950",
  "border-cyan-600/80 bg-cyan-800",
  "border-cyan-400/90 bg-cyan-600 shadow-[0_0_5px_rgba(34,211,238,0.35)]",
  "border-cyan-200 bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.65)]",
]

export function ContributionHeatmap({ year, availableYears, contributions }: ContributionHeatmapProps) {
  const weeks = heatmapWeeks(year, contributions)
  const total = contributions.reduce((sum, item) => sum + item.count, 0)

  return (
    <TechFrameCard className="min-h-0" contentClassName="min-h-0 gap-5 px-8 py-8 sm:min-h-0 sm:px-12 lg:px-16">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-2xl text-white">
            {total.toLocaleString()} completion {total === 1 ? "contribution" : "contributions"} in {year}
          </h2>
        </div>
        <nav aria-label="Contribution year" className="flex flex-wrap gap-2">
          {availableYears.map((availableYear) => (
            <Link
              key={availableYear}
              href={`/analytics?year=${availableYear}`}
              aria-current={availableYear === year ? "page" : undefined}
              className={cn(
                "rounded-lg border px-4 py-2 font-semibold text-sm transition-colors",
                availableYear === year
                  ? "border-cyan-300/70 bg-cyan-500/25 text-white shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                  : "border-blue-500/25 bg-blue-950/45 text-cyan-100/65 hover:border-cyan-400/45 hover:text-cyan-100",
              )}
            >
              {availableYear}
            </Link>
          ))}
        </nav>
      </div>

      <ScrollArea orientation="horizontal" className="pb-3">
        <div className="min-w-[980px] rounded-xl border border-cyan-300/20 bg-[#03172d]/80 p-5">
          <div className="mb-2 ml-[5.5rem] flex gap-1">
            {weeks.map((week, index) => {
              const firstOfMonth = week.find((day) => day.isInYear && day.date.getUTCDate() === 1)
              return (
                <div key={week[0]?.key ?? index} className="w-3 shrink-0 text-cyan-100/65 text-xs">
                  {firstOfMonth ? monthFormatter.format(firstOfMonth.date) : ""}
                </div>
              )
            })}
          </div>
          <div className="flex gap-2">
            <div aria-hidden="true" className="grid w-20 shrink-0 grid-rows-7 gap-1 text-cyan-100/55 text-xs">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((weekday) => (
                <span key={weekday} className="flex h-3 items-center justify-end leading-none">
                  {weekday}
                </span>
              ))}
            </div>
            <div className="flex gap-1" role="img" aria-label={`${year} task completion contribution calendar`}>
              {weeks.map((week, index) => (
                <div key={week[0]?.key ?? index} className="grid grid-rows-7 gap-1">
                  {week.map((day) => {
                    const label = `${day.count} ${day.count === 1 ? "contribution" : "contributions"} on ${fullDateFormatter.format(day.date)}`
                    return (
                      <span
                        key={day.key}
                        aria-hidden="true"
                        title={day.isInYear ? label : undefined}
                        className={cn(
                          "size-3 rounded-[3px] border",
                          day.isInYear
                            ? levelClasses[contributionLevel(day.count)]
                            : "border-transparent bg-transparent",
                        )}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-1 text-cyan-100/55 text-xs">
            <span className="mr-1">Less</span>
            {levelClasses.map((className) => (
              <span key={className} aria-hidden="true" className={cn("size-3 rounded-[3px] border", className)} />
            ))}
            <span className="ml-1">More</span>
          </div>
        </div>
      </ScrollArea>
    </TechFrameCard>
  )
}
