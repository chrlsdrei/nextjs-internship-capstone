import "server-only"

import type { AnalyticsDashboardDto } from "@/features/analytics/analytics.types"
import {
  countRecentContributors,
  readCompletionContributions,
  readProjectProgress,
  readRecentActivity,
} from "@/features/analytics/repositories/analytics.repository"
import { getCurrentDatabaseUser } from "@/features/auth/services/session.service"
import { listAccessibleProjects } from "@/features/projects/repositories/project.repository"

const DAY_MS = 24 * 60 * 60 * 1_000
const MANILA_TIME_ZONE = "Asia/Manila"

function manilaDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

function recentDateKeys(days: number, now: Date) {
  return Array.from({ length: days }, (_, index) =>
    manilaDateKey(new Date(now.getTime() - (days - index - 1) * DAY_MS)),
  )
}

function validAnalyticsYear(value: number | undefined, currentYear: number) {
  return value && Number.isInteger(value) && value >= 2020 && value <= currentYear ? value : currentYear
}

export async function getAnalyticsDashboard(
  requestedYear?: number,
  workspaceId?: string,
): Promise<AnalyticsDashboardDto> {
  const user = await getCurrentDatabaseUser()
  const accessibleProjects = await listAccessibleProjects(user.id, undefined, workspaceId)
  const projectIds = accessibleProjects.map((project) => project.id)
  const now = new Date()
  const currentYear = Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: MANILA_TIME_ZONE }).format(now))
  const year = validAnalyticsYear(requestedYear, currentYear)
  const yearStart = new Date(`${year}-01-01T00:00:00+08:00`)
  const yearEnd = new Date(`${year + 1}-01-01T00:00:00+08:00`)
  const activityStartsAt = new Date(now.getTime() - 14 * DAY_MS)
  const contributorStartsAt = new Date(now.getTime() - 30 * DAY_MS)

  const [projectProgress, contributions, recentActivity, activeContributors] = await Promise.all([
    readProjectProgress(projectIds),
    readCompletionContributions(projectIds, yearStart, yearEnd),
    readRecentActivity(projectIds, activityStartsAt),
    countRecentContributors(projectIds, contributorStartsAt),
  ])

  const totalTasks = projectProgress.reduce((total, project) => total + project.totalTasks, 0)
  const completedTasks = projectProgress.reduce((total, project) => total + project.completedTasks, 0)
  const contributionCount = contributions.reduce((total, contribution) => total + contribution.count, 0)
  const activityByDate = new Map(recentActivity.map((activity) => [activity.date, activity.count]))
  const availableYears = Array.from(new Set([year, currentYear, currentYear - 1, currentYear - 2])).sort(
    (left, right) => right - left,
  )

  return {
    year,
    availableYears,
    contributions,
    contributionCount,
    totalTasks,
    completedTasks,
    completionRate: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
    activeContributors,
    projectCount: projectProgress.length,
    projectProgress,
    dailyActivity: recentDateKeys(14, now).map((date) => ({ date, count: activityByDate.get(date) ?? 0 })),
  }
}
