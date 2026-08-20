import "server-only"

import { getDashboardSummary as getDashboardSummaryService } from "@/features/projects/services/project.service"

export async function getDashboardSummary(
  ...args: Parameters<typeof getDashboardSummaryService>
): Promise<Awaited<ReturnType<typeof getDashboardSummaryService>>> {
  return getDashboardSummaryService(...args)
}
