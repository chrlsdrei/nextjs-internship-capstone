"use server"

import { formValue, runBoardAction } from "@/features/board/actions/board-action-support"
import { deleteTask } from "@/features/board/services/board.service"
import type { ActionState } from "@/lib/action-state"

export async function deleteTaskAction(_: ActionState, formData: FormData) {
  const projectId = formValue(formData, "projectId")
  return runBoardAction(projectId, () => deleteTask(projectId, formValue(formData, "taskId")))
}
