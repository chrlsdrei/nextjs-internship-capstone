"use server"

import { runBoardAction } from "@/features/board/actions/board-action-support"
import { reorderLists } from "@/features/board/services/board.service"
import type { ActionState } from "@/lib/action-state"

export async function reorderListsCommandAction(command: {
  projectId: string
  listIds: string[]
}): Promise<ActionState> {
  return runBoardAction(command.projectId, () => reorderLists(command.projectId, { listIds: command.listIds }))
}
