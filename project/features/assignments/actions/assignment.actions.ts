"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"
import { addTaskAssignee, removeTaskAssignee, setTaskAssignees } from "@/features/assignments/server/assignment.service"
import type { ChangeTaskAssigneeCommand, SetTaskAssigneesCommand } from "@/features/board/board.types"
import { publishProjectEvent } from "@/features/board/server/project-event.service"
import { ProjectAccessError } from "@/features/projects/server/project-access.service"
import { RateLimitError } from "@/features/rate-limits/rate-limit.error"
import type { ActionState } from "@/lib/action-state"
import { actionError, actionSuccess } from "@/lib/action-state"

function errorState(error: unknown): ActionState {
  if (error instanceof RateLimitError) {
    return actionError(error.message, undefined, { code: error.code, retryAfterSeconds: error.retryAfterSeconds })
  }
  if (error instanceof ProjectAccessError) return actionError(error.message)
  if (error instanceof ZodError) return actionError(error.issues[0]?.message ?? "Please check the assignees")
  console.error("Task assignment action failed", error)
  return actionError("Something went wrong. Please try again.")
}

async function run(projectId: string, callback: () => Promise<void>): Promise<ActionState> {
  try {
    await callback()
    publishProjectEvent(projectId, "board.updated")
    revalidatePath(`/projects/${projectId}`)
    return actionSuccess(undefined, "Task assignees saved.")
  } catch (error) {
    return errorState(error)
  }
}

export async function setTaskAssigneesAction(command: SetTaskAssigneesCommand) {
  return run(command.projectId, () => setTaskAssignees(command))
}

export async function addTaskAssigneeAction(command: ChangeTaskAssigneeCommand) {
  return run(command.projectId, () => addTaskAssignee(command))
}

export async function removeTaskAssigneeAction(command: ChangeTaskAssigneeCommand) {
  return run(command.projectId, () => removeTaskAssignee(command))
}
