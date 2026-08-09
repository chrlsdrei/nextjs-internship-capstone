import "server-only"

import { recordActivity } from "@/features/activity/server/activity.service"
import { recordTaskAssignmentActivity } from "@/features/assignments/server/assignment.service"
import { boardCapabilities } from "@/features/board/board.policy"
import {
  listIdSchema,
  listSchema,
  moveTaskSchema,
  reorderListsSchema,
  reorderTasksSchema,
  taskIdSchema,
  taskSchema,
  updateListSchema,
  updateTaskSchema,
} from "@/features/board/board.schema"
import type { BoardTaskDto, ProjectBoardDto } from "@/features/board/board.types"
import { readProjectBoard } from "@/features/board/server/board.repository"
import {
  deleteListAndCompact,
  insertList,
  updateListName,
  updateListOrder,
} from "@/features/board/server/list.repository"
import {
  deleteTaskAndCompact,
  insertTask,
  moveTaskRecord,
  updateTaskOrder,
  updateTaskRecord,
} from "@/features/board/server/task.repository"
import type { LabelDto } from "@/features/labels/label.types"
import { findTaskLabelContext } from "@/features/labels/server/label.repository"
import { projectIdSchema } from "@/features/projects/project.schema"
import { findProjectById } from "@/features/projects/server/project.repository"
import type { ProjectPermission } from "@/features/projects/server/project-access.service"
import { ProjectAccessError, requireProjectPermission } from "@/features/projects/server/project-access.service"
import type { RateLimitAction } from "@/features/rate-limits/rate-limit.types"
import { enforceRateLimit } from "@/features/rate-limits/server/rate-limit.service"
import { findActiveWorkspaceAccess } from "@/features/workspaces/server/workspace.repository"

type ProjectAccess = Awaited<ReturnType<typeof requireProjectPermission>>

async function activityContext(projectId: string, access: ProjectAccess) {
  const [project, workspace] = await Promise.all([
    findProjectById(projectId),
    findActiveWorkspaceAccess(access.workspaceId, access.user.id),
  ])
  if (!project || !workspace) throw new ProjectAccessError("Activity context is unavailable", 409)
  return {
    workspaceId: access.workspaceId,
    projectId,
    actorWorkspaceMemberId: access.workspaceMemberId,
    actorName: access.user.name,
    workspaceName: workspace.name,
    projectTitle: project.title,
  }
}

function activityMetadata(context: Awaited<ReturnType<typeof activityContext>>) {
  return {
    actorName: context.actorName,
    workspaceName: context.workspaceName,
    projectTitle: context.projectTitle,
  }
}

async function boardSnapshot(projectId: string) {
  const board = await readProjectBoard(projectId)
  return board
}

async function requireRateLimitedBoardWrite(projectId: string, permission: ProjectPermission, action: RateLimitAction) {
  const access = await requireProjectPermission(projectId, permission)
  await enforceRateLimit({ action, actorUserId: access.user.id, workspaceId: access.workspaceId })
  return access
}

export async function getProjectBoard(projectId: string): Promise<ProjectBoardDto> {
  const id = projectIdSchema.parse(projectId)
  const access = await requireProjectPermission(id, "view")
  const { listRows, memberRows, taskRows, labelRows, taskLabelRows, taskAssigneeRows, settings } =
    await readProjectBoard(id)
  if (!settings) throw new ProjectAccessError("Project settings not found", 404)
  const tasksByList = new Map<string, BoardTaskDto[]>()
  const labelsByTask = new Map<string, LabelDto[]>()
  const assigneesByTask = new Map<string, ProjectBoardDto["members"]>()

  for (const label of taskLabelRows) {
    const current = labelsByTask.get(label.taskId) ?? []
    current.push({
      id: label.id,
      projectId: label.projectId,
      name: label.name,
      color: label.color,
      createdAt: label.createdAt.toISOString(),
      updatedAt: label.updatedAt.toISOString(),
    })
    labelsByTask.set(label.taskId, current)
  }

  for (const assignee of taskAssigneeRows) {
    const current = assigneesByTask.get(assignee.taskId) ?? []
    current.push({
      id: assignee.id,
      userId: assignee.userId,
      workspaceMemberId: assignee.workspaceMemberId,
      name: assignee.name,
      email: assignee.email,
    })
    assigneesByTask.set(assignee.taskId, current)
  }

  for (const task of taskRows) {
    const current = tasksByList.get(task.listId) ?? []
    const assignees = assigneesByTask.get(task.id) ?? []
    current.push({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate?.toISOString() ?? null,
      position: task.position,
      assignees,
      assignee: assignees[0] ?? null,
      labels: labelsByTask.get(task.id) ?? [],
    })
    tasksByList.set(task.listId, current)
  }

  return {
    role: access.role,
    capabilities: boardCapabilities(access.role, settings.editorsCanAssignTasks),
    members: memberRows,
    labels: labelRows.map((label) => ({
      id: label.id,
      projectId: label.projectId,
      name: label.name,
      color: label.color,
      createdAt: label.createdAt.toISOString(),
      updatedAt: label.updatedAt.toISOString(),
    })),
    lists: listRows.map((list) => ({
      id: list.id,
      name: list.name,
      position: list.position,
      tasks: tasksByList.get(list.id) ?? [],
    })),
  }
}

export async function createList(projectId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const values = listSchema.parse(input)
  const access = await requireRateLimitedBoardWrite(id, "manage", "board.list.write")
  const list = await insertList(id, access.user.id, values)
  if (!list) throw new ProjectAccessError("Project not found or you cannot manage its lists", 404)
  const context = await activityContext(id, access)
  await recordActivity({
    ...context,
    event: { action: "list.created", metadata: { ...activityMetadata(context), listName: values.name } },
  })
  return list
}

export async function renameList(projectId: string, listId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const parsedListId = listIdSchema.parse(listId)
  const values = updateListSchema.parse(input)
  if (!values.name) throw new ProjectAccessError("A list name is required", 422)
  const access = await requireRateLimitedBoardWrite(id, "manage", "board.list.write")
  if (!(await updateListName(id, access.user.id, parsedListId, values))) {
    throw new ProjectAccessError("List not found or you cannot manage it", 404)
  }
  const context = await activityContext(id, access)
  await recordActivity({
    ...context,
    event: { action: "list.renamed", metadata: { ...activityMetadata(context), listName: values.name } },
  })
}

export async function deleteList(projectId: string, listId: string) {
  const id = projectIdSchema.parse(projectId)
  const parsedListId = listIdSchema.parse(listId)
  const access = await requireRateLimitedBoardWrite(id, "manage", "board.list.write")
  const snapshot = await boardSnapshot(id)
  const listSnapshot = snapshot.listRows.find((list) => list.id === parsedListId)
  if (!listSnapshot) throw new ProjectAccessError("List not found", 404)
  if (!(await deleteListAndCompact(id, access.user.id, parsedListId))) {
    throw new ProjectAccessError("List not found or you cannot manage it", 404)
  }
  const context = await activityContext(id, access)
  await recordActivity({
    ...context,
    event: { action: "list.deleted", metadata: { ...activityMetadata(context), listName: listSnapshot.name } },
  })
}

export async function reorderLists(projectId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const values = reorderListsSchema.parse(input)
  const access = await requireRateLimitedBoardWrite(id, "manage", "board.drag")
  if ((await updateListOrder(id, access.user.id, values)) !== values.listIds.length) {
    throw new ProjectAccessError("Lists changed or you cannot reorder them", 409)
  }
  const context = await activityContext(id, access)
  await recordActivity({
    ...context,
    event: {
      action: "list.reordered",
      metadata: { ...activityMetadata(context), listCount: values.listIds.length },
    },
  })
}

export async function createTask(projectId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const values = taskSchema.parse(input)
  const access = await requireRateLimitedBoardWrite(id, "edit", "board.task.write")
  const task = await insertTask(id, access.user.id, values)
  if (!task) {
    throw new ProjectAccessError("List not found, an assignee is invalid, or you cannot create tasks", 404)
  }
  const context = await activityContext(id, access)
  await recordActivity({
    ...context,
    taskId: task.id,
    event: { action: "task.created", metadata: { ...activityMetadata(context), taskTitle: values.title } },
  })
  if (values.labelIds.length) {
    const labelContext = await findTaskLabelContext(id, task.id, values.labelIds)
    await recordActivity({
      ...context,
      taskId: task.id,
      event: {
        action: "task.labels_updated",
        metadata: {
          ...activityMetadata(context),
          taskTitle: values.title,
          labelNames: labelContext.labels.map((label) => label.name),
        },
      },
    })
  }
  if (values.assigneeIds.length) {
    await recordTaskAssignmentActivity(id, task.id, access)
  }
  return task
}

export async function updateTask(projectId: string, taskId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const parsedTaskId = taskIdSchema.parse(taskId)
  const values = updateTaskSchema.parse(input)
  const access = await requireRateLimitedBoardWrite(id, "edit", "board.task.write")
  const snapshot = await boardSnapshot(id)
  const taskSnapshot = snapshot.taskRows.find((task) => task.id === parsedTaskId)
  if (!taskSnapshot) throw new ProjectAccessError("Task not found", 404)
  if (!(await updateTaskRecord(id, access.user.id, parsedTaskId, values))) {
    throw new ProjectAccessError("Task not found, an assignee is invalid, or you cannot edit it", 404)
  }
  const context = await activityContext(id, access)
  await recordActivity({
    ...context,
    taskId: parsedTaskId,
    event: {
      action: "task.updated",
      metadata: { ...activityMetadata(context), taskTitle: values.title ?? taskSnapshot.title },
    },
  })
  if (values.labelIds !== undefined) {
    const labelContext = await findTaskLabelContext(id, parsedTaskId, values.labelIds)
    await recordActivity({
      ...context,
      taskId: parsedTaskId,
      event: {
        action: "task.labels_updated",
        metadata: {
          ...activityMetadata(context),
          taskTitle: values.title ?? taskSnapshot.title,
          labelNames: labelContext.labels.map((label) => label.name),
        },
      },
    })
  }
  if (values.assigneeIds !== undefined) {
    await recordTaskAssignmentActivity(id, parsedTaskId, access)
  }
}

export async function moveTask(projectId: string, taskId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const parsedTaskId = taskIdSchema.parse(taskId)
  const values = moveTaskSchema.parse(input)
  const access = await requireRateLimitedBoardWrite(id, "edit", "board.drag")
  const snapshot = await boardSnapshot(id)
  const taskSnapshot = snapshot.taskRows.find((task) => task.id === parsedTaskId)
  const sourceList = taskSnapshot ? snapshot.listRows.find((list) => list.id === taskSnapshot.listId) : null
  const targetList = snapshot.listRows.find((list) => list.id === values.targetListId)
  if (!taskSnapshot || !sourceList || !targetList) throw new ProjectAccessError("Task or list not found", 404)
  if (!(await moveTaskRecord(id, access.user.id, parsedTaskId, values))) {
    throw new ProjectAccessError("Task, destination list, or target position is invalid, or you cannot move it", 409)
  }
  const context = await activityContext(id, access)
  await recordActivity({
    ...context,
    taskId: parsedTaskId,
    event: {
      action: "task.moved",
      metadata: {
        ...activityMetadata(context),
        taskTitle: taskSnapshot.title,
        sourceListName: sourceList.name,
        targetListName: targetList.name,
      },
    },
  })
}

export async function deleteTask(projectId: string, taskId: string) {
  const id = projectIdSchema.parse(projectId)
  const parsedTaskId = taskIdSchema.parse(taskId)
  const access = await requireRateLimitedBoardWrite(id, "manage", "board.task.write")
  const snapshot = await boardSnapshot(id)
  const taskSnapshot = snapshot.taskRows.find((task) => task.id === parsedTaskId)
  if (!taskSnapshot) throw new ProjectAccessError("Task not found", 404)
  if (!(await deleteTaskAndCompact(id, access.user.id, parsedTaskId))) {
    throw new ProjectAccessError("Task not found or you cannot delete it", 404)
  }
  const context = await activityContext(id, access)
  await recordActivity({
    ...context,
    taskId: null,
    event: { action: "task.deleted", metadata: { ...activityMetadata(context), taskTitle: taskSnapshot.title } },
  })
}

export async function reorderTasks(projectId: string, listId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const parsedListId = listIdSchema.parse(listId)
  const values = reorderTasksSchema.parse(input)
  const access = await requireRateLimitedBoardWrite(id, "edit", "board.drag")
  const snapshot = await boardSnapshot(id)
  const listSnapshot = snapshot.listRows.find((list) => list.id === parsedListId)
  if (!listSnapshot) throw new ProjectAccessError("List not found", 404)
  if ((await updateTaskOrder(id, access.user.id, parsedListId, values)) !== values.taskIds.length) {
    throw new ProjectAccessError("Tasks changed or you cannot reorder them", 409)
  }
  const context = await activityContext(id, access)
  await recordActivity({
    ...context,
    event: {
      action: "task.reordered",
      metadata: { ...activityMetadata(context), listName: listSnapshot.name, taskCount: values.taskIds.length },
    },
  })
}
