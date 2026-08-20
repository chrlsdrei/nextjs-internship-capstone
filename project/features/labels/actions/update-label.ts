"use server"

import { completeLabelAction, labelActionError } from "@/features/labels/actions/label-action-support"
import { updateLabel } from "@/features/labels/services/label.service"
import type { ActionState } from "@/lib/action-state"

export async function updateLabelAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const projectId = String(formData.get("projectId") ?? "")
  try {
    await updateLabel(projectId, String(formData.get("labelId") ?? ""), {
      name: formData.has("name") ? formData.get("name") : undefined,
      color: formData.has("color") ? formData.get("color") : undefined,
    })
    return completeLabelAction(projectId, "Label updated.")
  } catch (error) {
    return labelActionError(error)
  }
}
