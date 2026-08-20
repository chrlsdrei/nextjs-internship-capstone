"use server"

import { completeLabelAction, labelActionError } from "@/features/labels/actions/label-action-support"
import { createLabel } from "@/features/labels/services/label.service"
import type { ActionState } from "@/lib/action-state"

export async function createLabelAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const projectId = String(formData.get("projectId") ?? "")
  try {
    await createLabel(projectId, { name: formData.get("name"), color: formData.get("color") })
    return completeLabelAction(projectId, "Label created.")
  } catch (error) {
    return labelActionError(error)
  }
}
