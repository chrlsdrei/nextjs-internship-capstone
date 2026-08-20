export type AnalyticsContributionDto = {
  date: string
  count: number
}

export type AnalyticsProjectProgressDto = {
  id: string
  title: string
  totalTasks: number
  completedTasks: number
}

export type AnalyticsDailyActivityDto = {
  date: string
  count: number
}

export type AnalyticsDashboardDto = {
  year: number
  availableYears: number[]
  contributions: AnalyticsContributionDto[]
  contributionCount: number
  totalTasks: number
  completedTasks: number
  completionRate: number
  activeContributors: number
  projectCount: number
  projectProgress: AnalyticsProjectProgressDto[]
  dailyActivity: AnalyticsDailyActivityDto[]
}
