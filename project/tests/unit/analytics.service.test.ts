import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getCurrentDatabaseUser: vi.fn(),
  listAccessibleProjects: vi.fn(),
  readProjectProgress: vi.fn(),
  readCompletionContributions: vi.fn(),
  readRecentActivity: vi.fn(),
  countRecentContributors: vi.fn(),
}))

vi.mock("@/features/auth/server/session.service", () => ({
  getCurrentDatabaseUser: mocks.getCurrentDatabaseUser,
}))
vi.mock("@/features/projects/server/project.repository", () => ({
  listAccessibleProjects: mocks.listAccessibleProjects,
}))
vi.mock("@/features/analytics/server/analytics.repository", () => ({
  readProjectProgress: mocks.readProjectProgress,
  readCompletionContributions: mocks.readCompletionContributions,
  readRecentActivity: mocks.readRecentActivity,
  countRecentContributors: mocks.countRecentContributors,
}))

import { getAnalyticsDashboard } from "@/features/analytics/server/analytics.service"

describe("analytics service", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-19T04:00:00.000Z"))
    vi.clearAllMocks()
    mocks.getCurrentDatabaseUser.mockResolvedValue({ id: "user-1" })
    mocks.listAccessibleProjects.mockResolvedValue([{ id: "project-1" }, { id: "project-2" }])
    mocks.readProjectProgress.mockResolvedValue([
      { id: "project-1", title: "Alpha", totalTasks: 5, completedTasks: 3 },
      { id: "project-2", title: "Beta", totalTasks: 3, completedTasks: 1 },
    ])
    mocks.readCompletionContributions.mockResolvedValue([
      { date: "2026-08-18", count: 2 },
      { date: "2026-08-19", count: 1 },
    ])
    mocks.readRecentActivity.mockResolvedValue([{ date: "2026-08-19", count: 4 }])
    mocks.countRecentContributors.mockResolvedValue(2)
  })

  afterEach(() => vi.useRealTimers())

  it("aggregates accessible project progress, contributions, and recent activity", async () => {
    const result = await getAnalyticsDashboard(2026)

    expect(mocks.readProjectProgress).toHaveBeenCalledWith(["project-1", "project-2"])
    expect(result).toMatchObject({
      year: 2026,
      contributionCount: 3,
      totalTasks: 8,
      completedTasks: 4,
      completionRate: 50,
      activeContributors: 2,
      projectCount: 2,
    })
    expect(result.dailyActivity).toHaveLength(14)
    expect(result.dailyActivity.at(-1)).toEqual({ date: "2026-08-19", count: 4 })
  })

  it("falls back to the current Manila year for invalid future selections", async () => {
    const result = await getAnalyticsDashboard(2030)

    expect(result.year).toBe(2026)
    expect(mocks.readCompletionContributions).toHaveBeenCalledWith(
      ["project-1", "project-2"],
      new Date("2025-12-31T16:00:00.000Z"),
      new Date("2026-12-31T16:00:00.000Z"),
    )
  })
})
