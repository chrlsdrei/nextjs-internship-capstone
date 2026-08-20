import "server-only"

import { getProjectById as getProjectByIdService } from "@/features/projects/services/project.service"

export async function getProjectById(
  ...args: Parameters<typeof getProjectByIdService>
): Promise<Awaited<ReturnType<typeof getProjectByIdService>>> {
  return getProjectByIdService(...args)
}
