"use server"

import { runBoardAction } from "@/features/board/actions/board-action-support"
import type { ReorderTasksCommand } from "@/features/board/board.types"
import { reorderTasks } from "@/features/board/services/board.service"

export async function reorderTasksCommandAction(command: ReorderTasksCommand) {
  return runBoardAction(command.projectId, () =>
    reorderTasks(command.projectId, command.listId, { taskIds: command.taskIds }),
  )
}
