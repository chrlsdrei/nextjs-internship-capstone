import "server-only"

import { getProjectManagementData as getProjectManagementDataService } from "@/features/members/services/member.service"

export async function getProjectManagementData(
  ...args: Parameters<typeof getProjectManagementDataService>
): Promise<Awaited<ReturnType<typeof getProjectManagementDataService>>> {
  return getProjectManagementDataService(...args)
}
