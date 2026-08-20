"use server"

import { runBoardAction } from "@/features/board/actions/board-action-support"
import type { MoveTaskCommand } from "@/features/board/board.types"
import { moveTask } from "@/features/board/services/board.service"

export async function moveTaskCommandAction(command: MoveTaskCommand) {
  return runBoardAction(command.projectId, () =>
    moveTask(command.projectId, command.taskId, {
      targetListId: command.targetListId,
      targetIndex: command.targetIndex,
    }),
  )
}
