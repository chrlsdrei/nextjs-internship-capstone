import "server-only"

import { getCurrentDatabaseUser } from "@/features/auth/server/session.service"
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
import { ProjectAccessError, requireProjectPermission } from "@/features/projects/server/project-access.service"

export async function getProjectBoard(projectId: string): Promise<ProjectBoardDto> {
  const id = projectIdSchema.parse(projectId)
  const access = await requireProjectPermission(id, "view")
  const { listRows, memberRows, taskRows } = await readProjectBoard(id)
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
  const actor = await getCurrentDatabaseUser()
  const list = await insertList(id, actor.id, values)
  if (!list) throw new ProjectAccessError("Project not found or you cannot manage its lists", 404)
  return list
}

export async function renameList(projectId: string, listId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const parsedListId = listIdSchema.parse(listId)
  const values = updateListSchema.parse(input)
  if (!values.name) throw new ProjectAccessError("A list name is required", 422)
  const actor = await getCurrentDatabaseUser()
  if (!(await updateListName(id, actor.id, parsedListId, values))) {
    throw new ProjectAccessError("List not found or you cannot manage it", 404)
  }
}

export async function deleteList(projectId: string, listId: string) {
  const id = projectIdSchema.parse(projectId)
  const parsedListId = listIdSchema.parse(listId)
  const actor = await getCurrentDatabaseUser()
  if (!(await deleteListAndCompact(id, actor.id, parsedListId))) {
    throw new ProjectAccessError("List not found or you cannot manage it", 404)
  }
}

export async function reorderLists(projectId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const values = reorderListsSchema.parse(input)
  const actor = await getCurrentDatabaseUser()
  if ((await updateListOrder(id, actor.id, values)) !== values.listIds.length) {
    throw new ProjectAccessError("Lists changed or you cannot reorder them", 409)
  }
}

export async function createTask(projectId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const values = taskSchema.parse(input)
  const actor = await getCurrentDatabaseUser()
  const task = await insertTask(id, actor.id, values)
  if (!task) {
    throw new ProjectAccessError("List not found, assignee is not a member, or you cannot create tasks", 404)
  }
  return task
}

export async function updateTask(projectId: string, taskId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const parsedTaskId = taskIdSchema.parse(taskId)
  const values = updateTaskSchema.parse(input)
  const actor = await getCurrentDatabaseUser()
  if (!(await updateTaskRecord(id, actor.id, parsedTaskId, values))) {
    throw new ProjectAccessError("Task not found, assignee is not a member, or you cannot edit it", 404)
  }
}

export async function moveTask(projectId: string, taskId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const parsedTaskId = taskIdSchema.parse(taskId)
  const values = moveTaskSchema.parse(input)
  const actor = await getCurrentDatabaseUser()
  if (!(await moveTaskRecord(id, actor.id, parsedTaskId, values))) {
    throw new ProjectAccessError("Task, destination list, or target position is invalid, or you cannot move it", 409)
  }
}

export async function deleteTask(projectId: string, taskId: string) {
  const id = projectIdSchema.parse(projectId)
  const parsedTaskId = taskIdSchema.parse(taskId)
  const actor = await getCurrentDatabaseUser()
  if (!(await deleteTaskAndCompact(id, actor.id, parsedTaskId))) {
    throw new ProjectAccessError("Task not found or you cannot delete it", 404)
  }
}

export async function reorderTasks(projectId: string, listId: string, input: unknown) {
  const id = projectIdSchema.parse(projectId)
  const parsedListId = listIdSchema.parse(listId)
  const values = reorderTasksSchema.parse(input)
  const actor = await getCurrentDatabaseUser()
  if ((await updateTaskOrder(id, actor.id, parsedListId, values)) !== values.taskIds.length) {
    throw new ProjectAccessError("Tasks changed or you cannot reorder them", 409)
  }
}
