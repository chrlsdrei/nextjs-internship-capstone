"use server"

import { runAssignmentAction } from "@/features/assignments/actions/assignment-action-support"
import { addTaskAssignee } from "@/features/assignments/services/assignment.service"
import type { ChangeTaskAssigneeCommand } from "@/features/board/board.types"

export async function addTaskAssigneeAction(command: ChangeTaskAssigneeCommand) {
  return runAssignmentAction(command.projectId, () => addTaskAssignee(command))
}
