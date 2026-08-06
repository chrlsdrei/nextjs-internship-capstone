import "server-only"

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
import { projectIdSchema } from "@/features/projects/project.schema"
import type { ProjectPermission } from "@/features/projects/server/project-access.service"
import { ProjectAccessError, requireProjectPermission } from "@/features/projects/server/project-access.service"
import type { RateLimitAction } from "@/features/rate-limits/rate-limit.types"
import { enforceRateLimit } from "@/features/rate-limits/server/rate-limit.service"

async function requireRateLimitedBoardWrite(projectId: string, permission: ProjectPermission, action: RateLimitAction) {
  const access = await requireProjectPermission(projectId, permission)
  await enforceRateLimit({ action, actorUserId: access.user.id, workspaceId: access.workspaceId })
  return access
}

export async function getProjectBoard(projectId: string): Promise<ProjectBoardDto> {
  const id = projectIdSchema.parse(projectId)
  const access = await requireProjectPermission(id, "view")
  const { listRows, memberRows, taskRows, settings } = await readProjectBoard(id)
  if (!settings) throw new ProjectAccessError("Project settings not found", 404)
  const tasksByList = new Map<string, BoardTaskDto[]>()

  for (const task of taskRows) {
    const current = tasksByList.get(task.listId) ?? []
    current.push({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate?.toISOString() ?? null,
      position: task.position,
      assignee: task.assigneeId
        ? { id: task.assigneeId, name: task.assigneeName ?? "Unknown", email: task.assigneeEmail ?? "" }
        : null,
    })
    tasksByList.set(task.listId, current)
  }

  return {
    role: access.role,
    capabilities: boardCapabilities(access.role, settings.editorsCanAssignTasks),
    members: memberRows,
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
}

export async function deleteList(projectId: string, listId: string) {
  const id = projectIdSchema.parse(projectId)
  const parsedListId = listIdSchema.parse(listId)
  const access = await requireRateLimitedBoardWrite(id, "manage", "board.list.write")
  if (!(await deleteListAndCompact(id, access.user.id, parsedListId))) {
    throw new ProjectAccessError("List not found or you cannot manage it", 404)
  }
}

export async function reorderLists(projectId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const values = reorderListsSchema.parse(input)
  const access = await requireRateLimitedBoardWrite(id, "manage", "board.drag")
  if ((await updateListOrder(id, access.user.id, values)) !== values.listIds.length) {
    throw new ProjectAccessError("Lists changed or you cannot reorder them", 409)
  }
}

export async function createTask(projectId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const values = taskSchema.parse(input)
  const access = await requireRateLimitedBoardWrite(id, "edit", "board.task.write")
  const task = await insertTask(id, access.user.id, values)
  if (!task) {
    throw new ProjectAccessError("List not found, assignee is not a member, or you cannot create tasks", 404)
  }
  return task
}

export async function updateTask(projectId: string, taskId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const parsedTaskId = taskIdSchema.parse(taskId)
  const values = updateTaskSchema.parse(input)
  const access = await requireRateLimitedBoardWrite(id, "edit", "board.task.write")
  if (!(await updateTaskRecord(id, access.user.id, parsedTaskId, values))) {
    throw new ProjectAccessError("Task not found, assignee is not a member, or you cannot edit it", 404)
  }
}

export async function moveTask(projectId: string, taskId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const parsedTaskId = taskIdSchema.parse(taskId)
  const values = moveTaskSchema.parse(input)
  const access = await requireRateLimitedBoardWrite(id, "edit", "board.drag")
  if (!(await moveTaskRecord(id, access.user.id, parsedTaskId, values))) {
    throw new ProjectAccessError("Task, destination list, or target position is invalid, or you cannot move it", 409)
  }
}

export async function deleteTask(projectId: string, taskId: string) {
  const id = projectIdSchema.parse(projectId)
  const parsedTaskId = taskIdSchema.parse(taskId)
  const access = await requireRateLimitedBoardWrite(id, "manage", "board.task.write")
  if (!(await deleteTaskAndCompact(id, access.user.id, parsedTaskId))) {
    throw new ProjectAccessError("Task not found or you cannot delete it", 404)
  }
}

export async function reorderTasks(projectId: string, listId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const parsedListId = listIdSchema.parse(listId)
  const values = reorderTasksSchema.parse(input)
  const access = await requireRateLimitedBoardWrite(id, "edit", "board.drag")
  if ((await updateTaskOrder(id, access.user.id, parsedListId, values)) !== values.taskIds.length) {
    throw new ProjectAccessError("Tasks changed or you cannot reorder them", 409)
  }
}
