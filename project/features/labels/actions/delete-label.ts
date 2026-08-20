"use server"

import { completeLabelAction, labelActionError } from "@/features/labels/actions/label-action-support"
import { deleteLabel } from "@/features/labels/services/label.service"
import type { ActionState } from "@/lib/action-state"

export async function deleteLabelAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const projectId = String(formData.get("projectId") ?? "")
  try {
    await deleteLabel(projectId, String(formData.get("labelId") ?? ""))
    return completeLabelAction(projectId, "Label deleted.")
  } catch (error) {
    return labelActionError(error)
  }
}
