"use server"

import { runAssignmentAction } from "@/features/assignments/actions/assignment-action-support"
import { removeTaskAssignee } from "@/features/assignments/services/assignment.service"
import type { ChangeTaskAssigneeCommand } from "@/features/board/board.types"

export async function removeTaskAssigneeAction(command: ChangeTaskAssigneeCommand) {
  return runAssignmentAction(command.projectId, () => removeTaskAssignee(command))
}
