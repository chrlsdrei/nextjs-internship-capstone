import "server-only"

import { getAiNavigationData as getAiNavigationDataService } from "@/features/ai/services/ai-generation.service"

export async function getAiNavigationData(
  ...args: Parameters<typeof getAiNavigationDataService>
): Promise<Awaited<ReturnType<typeof getAiNavigationDataService>>> {
  return getAiNavigationDataService(...args)
}
