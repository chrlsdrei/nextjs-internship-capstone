"use server"

import { formValue, runBoardAction } from "@/features/board/actions/board-action-support"
import { moveTask } from "@/features/board/services/board.service"
import type { ActionState } from "@/lib/action-state"

export async function moveTaskAction(_: ActionState, formData: FormData) {
  const projectId = formValue(formData, "projectId")
  return runBoardAction(projectId, () =>
    moveTask(projectId, formValue(formData, "taskId"), {
      targetListId: formValue(formData, "listId"),
      targetIndex: formData.get("targetIndex") || undefined,
    }),
  )
}
