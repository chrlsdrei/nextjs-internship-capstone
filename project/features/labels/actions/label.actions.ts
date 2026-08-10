"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"

import { publishProjectEvent } from "@/features/board/server/project-event.service"
import { LabelError } from "@/features/labels/label.error"
import type { SetTaskLabelsCommand } from "@/features/labels/label.types"
import { createLabel, deleteLabel, setTaskLabels, updateLabel } from "@/features/labels/server/label.service"
import { ProjectAccessError } from "@/features/projects/server/project-access.service"
import { RateLimitError } from "@/features/rate-limits/rate-limit.error"
import type { ActionState } from "@/lib/action-state"
import { actionError, actionSuccess } from "@/lib/action-state"

function errorState(error: unknown): ActionState {
  if (error instanceof RateLimitError) {
    return actionError(error.message, undefined, { code: error.code, retryAfterSeconds: error.retryAfterSeconds })
  }
  if (error instanceof LabelError) return actionError(error.message, undefined, { code: error.code })
  if (error instanceof ProjectAccessError) return actionError(error.message)
  if (error instanceof ZodError) return actionError(error.issues[0]?.message ?? "Please check the label values")
  console.error("Label action failed", error)
  return actionError("Something went wrong. Please try again.")
}

function complete(projectId: string, message: string): ActionState {
  publishProjectEvent(projectId, "board.updated")
  revalidatePath(`/projects/${projectId}`)
  return actionSuccess(undefined, message)
}

export async function createLabelAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const projectId = String(formData.get("projectId") ?? "")
  try {
    await createLabel(projectId, { name: formData.get("name"), color: formData.get("color") })
    return complete(projectId, "Label created.")
  } catch (error) {
    return errorState(error)
  }
}

export async function updateLabelAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const projectId = String(formData.get("projectId") ?? "")
  try {
    await updateLabel(projectId, String(formData.get("labelId") ?? ""), {
      name: formData.has("name") ? formData.get("name") : undefined,
      color: formData.has("color") ? formData.get("color") : undefined,
    })
    return complete(projectId, "Label updated.")
  } catch (error) {
    return errorState(error)
  }
}

export async function deleteLabelAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const projectId = String(formData.get("projectId") ?? "")
  try {
    await deleteLabel(projectId, String(formData.get("labelId") ?? ""))
    return complete(projectId, "Label deleted.")
  } catch (error) {
    return errorState(error)
  }
}

export async function setTaskLabelsAction(command: SetTaskLabelsCommand): Promise<ActionState> {
  try {
    await setTaskLabels(command)
    return complete(command.projectId, "Task labels saved.")
  } catch (error) {
    return errorState(error)
  }
}
