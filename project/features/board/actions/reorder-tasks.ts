"use server"

import { formValue, runBoardAction } from "@/features/board/actions/board-action-support"
import { reorderTasks } from "@/features/board/services/board.service"
import type { ActionState } from "@/lib/action-state"

export async function reorderTasksAction(_: ActionState, formData: FormData) {
  const projectId = formValue(formData, "projectId")
  return runBoardAction(projectId, () => {
    const taskIds = JSON.parse(formValue(formData, "taskIds")) as unknown
    return reorderTasks(projectId, formValue(formData, "listId"), { taskIds })
  })
}
