import "server-only"

import { getBoardAiData as getBoardAiDataService } from "@/features/ai/services/ai-generation.service"

export async function getBoardAiData(
  ...args: Parameters<typeof getBoardAiDataService>
): Promise<Awaited<ReturnType<typeof getBoardAiDataService>>> {
  return getBoardAiDataService(...args)
}
