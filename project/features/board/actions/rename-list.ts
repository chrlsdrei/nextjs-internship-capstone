"use server"

import { formValue, runBoardAction } from "@/features/board/actions/board-action-support"
import { renameList } from "@/features/board/services/board.service"
import type { ActionState } from "@/lib/action-state"

export async function renameListAction(_: ActionState, formData: FormData) {
  const projectId = formValue(formData, "projectId")
  return runBoardAction(projectId, () =>
    renameList(projectId, formValue(formData, "listId"), { name: formData.get("name") }),
  )
}
