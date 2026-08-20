"use server"

import { formValue, runBoardAction } from "@/features/board/actions/board-action-support"
import { reorderLists } from "@/features/board/services/board.service"
import type { ActionState } from "@/lib/action-state"

export async function reorderListsAction(_: ActionState, formData: FormData) {
  const projectId = formValue(formData, "projectId")
  return runBoardAction(projectId, () => {
    const listIds = JSON.parse(formValue(formData, "listIds")) as unknown
    return reorderLists(projectId, { listIds })
  })
}
