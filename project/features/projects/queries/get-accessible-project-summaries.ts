import "server-only"

import { getAccessibleProjectSummaries as getAccessibleProjectSummariesService } from "@/features/projects/services/project.service"

export async function getAccessibleProjectSummaries(
  ...args: Parameters<typeof getAccessibleProjectSummariesService>
): Promise<Awaited<ReturnType<typeof getAccessibleProjectSummariesService>>> {
  return getAccessibleProjectSummariesService(...args)
}
