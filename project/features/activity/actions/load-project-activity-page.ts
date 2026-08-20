"use server"

import type { ActivityPageDto } from "@/features/activity/activity.types"
import { listProjectActivity } from "@/features/activity/services/activity.service"

export async function loadProjectActivityPageAction(input: unknown): Promise<ActivityPageDto> {
  return listProjectActivity(input)
}
