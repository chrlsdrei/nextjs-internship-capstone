"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"

import type { MoveTaskCommand, ReorderTasksCommand } from "@/features/board/board.types"
import {
  createList,
  createTask,
  deleteList,
  deleteTask,
  moveTask,
  renameList,
  reorderLists,
  reorderTasks,
  updateTask,
} from "@/features/board/server/board.service"
import { publishProjectEvent } from "@/features/board/server/project-event.service"
import { ProjectAccessError } from "@/features/projects/server/project-access.service"
import type { ActionState } from "@/lib/action-state"
import { actionError, actionSuccess } from "@/lib/action-state"

function messageFor(error: unknown) {
  if (error instanceof ProjectAccessError) return error.message
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Please check the form"
  console.error("Board action failed", error)
  return "Something went wrong. Please try again."
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "")
}

function complete(projectId: string): ActionState {
  publishProjectEvent(projectId, "board.updated")
  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/projects")
  revalidatePath("/dashboard")
  return actionSuccess(undefined, "Saved.")
}

async function run(projectId: string, callback: () => Promise<unknown>): Promise<ActionState> {
  try {
    await callback()
    return complete(projectId)
  } catch (error) {
    return actionError(messageFor(error))
  }
}

export async function createListAction(_: ActionState, formData: FormData) {
  const projectId = value(formData, "projectId")
  return run(projectId, () => createList(projectId, { name: formData.get("name") }))
}

export async function renameListAction(_: ActionState, formData: FormData) {
  const projectId = value(formData, "projectId")
  return run(projectId, () => renameList(projectId, value(formData, "listId"), { name: formData.get("name") }))
}

export async function deleteListAction(_: ActionState, formData: FormData) {
  const projectId = value(formData, "projectId")
  return run(projectId, () => deleteList(projectId, value(formData, "listId")))
}

export async function reorderListsAction(_: ActionState, formData: FormData) {
  const projectId = value(formData, "projectId")
  return run(projectId, () => {
    const listIds = JSON.parse(value(formData, "listIds")) as unknown
    return reorderLists(projectId, { listIds })
  })
}

export async function createTaskAction(_: ActionState, formData: FormData) {
  const projectId = value(formData, "projectId")
  return run(projectId, () =>
    createTask(projectId, {
      title: formData.get("title"),
      description: formData.get("description"),
      listId: formData.get("listId"),
      assigneeId: formData.get("assigneeId"),
      priority: formData.get("priority"),
      dueDate: formData.get("dueDate"),
    }),
  )
}

export async function updateTaskAction(_: ActionState, formData: FormData) {
  const projectId = value(formData, "projectId")
  return run(projectId, () =>
    updateTask(projectId, value(formData, "taskId"), {
      title: formData.get("title"),
      description: formData.get("description"),
      assigneeId: formData.get("assigneeId"),
      priority: formData.get("priority"),
      dueDate: formData.get("dueDate"),
    }),
  )
}

export async function moveTaskAction(_: ActionState, formData: FormData) {
  const projectId = value(formData, "projectId")
  return run(projectId, () =>
    moveTask(projectId, value(formData, "taskId"), {
      targetListId: value(formData, "listId"),
      targetIndex: formData.get("targetIndex") || undefined,
    }),
  )
}

export async function deleteTaskAction(_: ActionState, formData: FormData) {
  const projectId = value(formData, "projectId")
  return run(projectId, () => deleteTask(projectId, value(formData, "taskId")))
}

export async function reorderTasksAction(_: ActionState, formData: FormData) {
  const projectId = value(formData, "projectId")
  return run(projectId, () => {
    const taskIds = JSON.parse(value(formData, "taskIds")) as unknown
    return reorderTasks(projectId, value(formData, "listId"), { taskIds })
  })
}

export async function moveTaskCommandAction(command: MoveTaskCommand) {
  return run(command.projectId, () =>
    moveTask(command.projectId, command.taskId, {
      targetListId: command.targetListId,
      targetIndex: command.targetIndex,
    }),
  )
}

export async function reorderTasksCommandAction(command: ReorderTasksCommand) {
  return run(command.projectId, () => reorderTasks(command.projectId, command.listId, { taskIds: command.taskIds }))
}
