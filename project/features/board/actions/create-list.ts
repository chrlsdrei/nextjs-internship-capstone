"use server"

import { formValue, runBoardAction } from "@/features/board/actions/board-action-support"
import { createList } from "@/features/board/services/board.service"
import type { ActionState } from "@/lib/action-state"

export async function createListAction(_: ActionState, formData: FormData) {
  const projectId = formValue(formData, "projectId")
  return runBoardAction(projectId, () => createList(projectId, { name: formData.get("name") }))
}
