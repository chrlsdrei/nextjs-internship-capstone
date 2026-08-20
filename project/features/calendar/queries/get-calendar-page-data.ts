import "server-only"

import { getCalendarPageData as getCalendarPageDataService } from "@/features/calendar/services/calendar.service"

export async function getCalendarPageData(
  ...args: Parameters<typeof getCalendarPageDataService>
): Promise<Awaited<ReturnType<typeof getCalendarPageDataService>>> {
  return getCalendarPageDataService(...args)
}
