"use server"

import { formValue, optionalJson, runBoardAction } from "@/features/board/actions/board-action-support"
import { updateTask } from "@/features/board/services/board.service"
import type { ActionState } from "@/lib/action-state"

export async function updateTaskAction(_: ActionState, formData: FormData) {
  const projectId = formValue(formData, "projectId")
  return runBoardAction(projectId, () =>
    updateTask(projectId, formValue(formData, "taskId"), {
      title: formData.get("title"),
      description: formData.get("description"),
      assigneeIds: optionalJson(formData, "assigneeIds"),
      priority: formData.get("priority"),
      dueDate: formData.get("dueDate"),
      labelIds: optionalJson(formData, "labelIds"),
    }),
  )
}
