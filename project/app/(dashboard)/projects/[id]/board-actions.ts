"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"

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
} from "@/lib/db/queries/board"
import { ProjectAccessError } from "@/lib/project-access"
import { publishProjectEvent } from "@/lib/project-events"

export type BoardActionState = { success: boolean; error?: string }
export const initialBoardActionState: BoardActionState = { success: false }

function messageFor(error: unknown) {
  if (error instanceof ProjectAccessError || error instanceof ZodError) {
    return error instanceof ZodError ? (error.issues[0]?.message ?? "Please check the form") : error.message
  }
  console.error("Board action failed", error)
  return "Something went wrong. Please try again."
}

function boardPath(projectId: string) {
  return `/projects/${projectId}`
}

function complete(projectId: string): BoardActionState {
  revalidatePath(boardPath(projectId))
  revalidatePath("/projects")
  revalidatePath("/dashboard")
  return { success: true }
}

async function run(projectId: string, callback: () => Promise<unknown>): Promise<BoardActionState> {
  try {
    await callback()
    publishProjectEvent(projectId, "board.updated")
    return complete(projectId)
  } catch (error) {
    return { success: false, error: messageFor(error) }
  }
}

const value = (formData: FormData, key: string) => String(formData.get(key) ?? "")
export async function createListAction(_: BoardActionState, formData: FormData) {
  const projectId = value(formData, "projectId")
  return run(projectId, () => createList(projectId, { name: formData.get("name") }))
}

export async function renameListAction(_: BoardActionState, formData: FormData) {
  const projectId = value(formData, "projectId")
  return run(projectId, () => renameList(projectId, value(formData, "listId"), { name: formData.get("name") }))
}

export async function deleteListAction(_: BoardActionState, formData: FormData) {
  const projectId = value(formData, "projectId")
  return run(projectId, () => deleteList(projectId, value(formData, "listId")))
}

export async function reorderListsAction(_: BoardActionState, formData: FormData) {
  const projectId = value(formData, "projectId")
  return run(projectId, () => {
    const listIds = JSON.parse(value(formData, "listIds")) as unknown
    return reorderLists(projectId, { listIds })
  })
}

export async function createTaskAction(_: BoardActionState, formData: FormData) {
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

export async function updateTaskAction(_: BoardActionState, formData: FormData) {
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

export async function moveTaskAction(_: BoardActionState, formData: FormData) {
  const projectId = value(formData, "projectId")
  return run(projectId, () =>
    moveTask(projectId, value(formData, "taskId"), {
      targetListId: value(formData, "listId"),
      targetIndex: formData.get("targetIndex") || undefined,
    }),
  )
}

export async function deleteTaskAction(_: BoardActionState, formData: FormData) {
  const projectId = value(formData, "projectId")
  return run(projectId, () => deleteTask(projectId, value(formData, "taskId")))
}

export async function reorderTasksAction(_: BoardActionState, formData: FormData) {
  const projectId = value(formData, "projectId")
  return run(projectId, () => {
    const taskIds = JSON.parse(value(formData, "taskIds")) as unknown
    return reorderTasks(projectId, value(formData, "listId"), { taskIds })
  })
}
