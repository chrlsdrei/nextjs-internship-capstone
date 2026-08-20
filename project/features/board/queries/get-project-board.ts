import "server-only"

import { getProjectBoard as getProjectBoardService } from "@/features/board/services/board.service"

export async function getProjectBoard(
  ...args: Parameters<typeof getProjectBoardService>
): Promise<Awaited<ReturnType<typeof getProjectBoardService>>> {
  return getProjectBoardService(...args)
}
