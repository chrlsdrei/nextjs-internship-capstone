import "server-only"

import { recordActivity } from "@/features/activity/server/activity.service"
import {
  addTaskAssigneeRecord,
  findTaskAssignmentContext,
  removeTaskAssigneeRecord,
  replaceTaskAssignees,
} from "@/features/assignments/server/assignment.repository"
import { requireWorkspaceWritable } from "@/features/billing/server/entitlement.service"
import { changeTaskAssigneeSchema, setTaskAssigneesSchema } from "@/features/board/board.schema"
import { publishTaskAssignmentNotifications } from "@/features/notifications/server/notification.service"
import { findProjectById } from "@/features/projects/server/project.repository"
import { ProjectAccessError, requireProjectPermission } from "@/features/projects/server/project-access.service"
import { enforceRateLimit } from "@/features/rate-limits/server/rate-limit.service"
import { findActiveWorkspaceAccess } from "@/features/workspaces/server/workspace.repository"

type AssignmentAccess = Awaited<ReturnType<typeof requireProjectPermission>>

export async function recordTaskAssignmentActivity(projectId: string, taskId: string, access: AssignmentAccess) {
  const [project, workspace, task] = await Promise.all([
    findProjectById(projectId),
    findActiveWorkspaceAccess(access.workspaceId, access.user.id),
    findTaskAssignmentContext(projectId, taskId),
  ])
  if (!project || !workspace || !task) throw new ProjectAccessError("Assignment context is unavailable", 409)
  await recordActivity({
    workspaceId: access.workspaceId,
    projectId,
    taskId,
    actorWorkspaceMemberId: access.workspaceMemberId,
    event: {
      action: "task.assignees_updated",
      metadata: {
        actorName: access.user.name,
        workspaceName: workspace.name,
        projectTitle: project.title,
        taskTitle: task.title,
        assigneeNames: task.assignees.map((assignee) => assignee.name),
      },
    },
  })
  await publishTaskAssignmentNotifications(taskId)
}

async function assignmentAccess(projectId: string, allowCleanup = false) {
  const access = await requireProjectPermission(projectId, "edit")
  if (!allowCleanup) await requireWorkspaceWritable(access.workspaceId, access.user.id)
  await enforceRateLimit({ action: "board.task.write", actorUserId: access.user.id, workspaceId: access.workspaceId })
  return access
}

export async function setTaskAssignees(input: unknown) {
  const values = setTaskAssigneesSchema.parse(input)
  const access = await assignmentAccess(values.projectId)
  const result = await replaceTaskAssignees(values.projectId, access.user.id, values.taskId, values.projectMemberIds)
  if (!result) throw new ProjectAccessError("Task or assignee is invalid, or you cannot assign tasks", 404)
  await recordTaskAssignmentActivity(values.projectId, values.taskId, access)
}

export async function addTaskAssignee(input: unknown) {
  const values = changeTaskAssigneeSchema.parse(input)
  const access = await assignmentAccess(values.projectId)
  const result = await addTaskAssigneeRecord(values.projectId, access.user.id, values.taskId, values.projectMemberId)
  if (!result) throw new ProjectAccessError("Task or assignee is invalid, or you cannot assign tasks", 404)
  await recordTaskAssignmentActivity(values.projectId, values.taskId, access)
}

export async function removeTaskAssignee(input: unknown) {
  const values = changeTaskAssigneeSchema.parse(input)
  const access = await assignmentAccess(values.projectId, true)
  const result = await removeTaskAssigneeRecord(values.projectId, access.user.id, values.taskId, values.projectMemberId)
  if (!result) throw new ProjectAccessError("Task is invalid or you cannot assign tasks", 404)
  await recordTaskAssignmentActivity(values.projectId, values.taskId, access)
}
