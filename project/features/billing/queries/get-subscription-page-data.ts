import "server-only"

import { getSubscriptionPageData as getSubscriptionPageDataService } from "@/features/billing/services/subscription-page.service"

export async function getSubscriptionPageData(
  ...args: Parameters<typeof getSubscriptionPageDataService>
): Promise<Awaited<ReturnType<typeof getSubscriptionPageDataService>>> {
  return getSubscriptionPageDataService(...args)
}
