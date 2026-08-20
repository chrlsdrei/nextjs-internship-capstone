"use server"

import { completeLabelAction, labelActionError } from "@/features/labels/actions/label-action-support"
import type { SetTaskLabelsCommand } from "@/features/labels/label.types"
import { setTaskLabels } from "@/features/labels/services/label.service"
import type { ActionState } from "@/lib/action-state"

export async function setTaskLabelsAction(command: SetTaskLabelsCommand): Promise<ActionState> {
  try {
    await setTaskLabels(command)
    return completeLabelAction(command.projectId, "Task labels saved.")
  } catch (error) {
    return labelActionError(error)
  }
}
