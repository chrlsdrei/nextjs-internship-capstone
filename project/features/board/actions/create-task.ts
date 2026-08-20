"use server"

import { formValue, optionalJson, runBoardAction } from "@/features/board/actions/board-action-support"
import { createTask } from "@/features/board/services/board.service"
import type { ActionState } from "@/lib/action-state"

export async function createTaskAction(_: ActionState, formData: FormData) {
  const projectId = formValue(formData, "projectId")
  return runBoardAction(projectId, () =>
    createTask(projectId, {
      title: formData.get("title"),
      description: formData.get("description"),
      listId: formData.get("listId"),
      assigneeIds: optionalJson(formData, "assigneeIds"),
      priority: formData.get("priority"),
      dueDate: formData.get("dueDate"),
      labelIds: optionalJson(formData, "labelIds"),
    }),
  )
}
