import "server-only"

import { getAnalyticsDashboard as getAnalyticsDashboardService } from "@/features/analytics/services/analytics.service"

export async function getAnalyticsDashboard(
  ...args: Parameters<typeof getAnalyticsDashboardService>
): Promise<Awaited<ReturnType<typeof getAnalyticsDashboardService>>> {
  return getAnalyticsDashboardService(...args)
}
