"use server"

import { runAssignmentAction } from "@/features/assignments/actions/assignment-action-support"
import { setTaskAssignees } from "@/features/assignments/services/assignment.service"
import type { SetTaskAssigneesCommand } from "@/features/board/board.types"

export async function setTaskAssigneesAction(command: SetTaskAssigneesCommand) {
  return runAssignmentAction(command.projectId, () => setTaskAssignees(command))
}
