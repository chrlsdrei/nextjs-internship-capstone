import "server-only"

import { listProjectActivity as listProjectActivityService } from "@/features/activity/services/activity.service"

export async function listProjectActivity(
  ...args: Parameters<typeof listProjectActivityService>
): Promise<Awaited<ReturnType<typeof listProjectActivityService>>> {
  return listProjectActivityService(...args)
}
