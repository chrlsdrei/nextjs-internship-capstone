import "server-only"

import { and, asc, eq, isNull } from "drizzle-orm"

import { db } from "@/server/db/client"
import {
  labels,
  lists,
  projectMembers,
  projectSettings,
  taskAssignees,
  taskLabels,
  tasks,
  users,
  workspaceMembers,
} from "@/server/db/schema"

export async function readProjectBoard(projectId: string) {
  const [listRows, memberRows, taskRows, labelRows, taskLabelRows, taskAssigneeRows, settingsRows] = await Promise.all([
    db.select().from(lists).where(eq(lists.projectId, projectId)).orderBy(asc(lists.position), asc(lists.createdAt)),
    db
      .select({
        id: projectMembers.id,
        userId: users.id,
        workspaceMemberId: workspaceMembers.id,
        name: users.name,
        email: users.email,
      })
      .from(projectMembers)
      .innerJoin(workspaceMembers, eq(projectMembers.workspaceMemberId, workspaceMembers.id))
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(and(eq(projectMembers.projectId, projectId), isNull(projectMembers.removedAt)))
      .orderBy(asc(users.name)),
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        position: tasks.position,
        listId: tasks.listId,
      })
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(asc(tasks.position), asc(tasks.createdAt)),
    db.select().from(labels).where(eq(labels.projectId, projectId)).orderBy(asc(labels.name), asc(labels.id)),
    db
      .select({
        taskId: taskLabels.taskId,
        id: labels.id,
        projectId: labels.projectId,
        name: labels.name,
        color: labels.color,
        createdAt: labels.createdAt,
        updatedAt: labels.updatedAt,
      })
      .from(taskLabels)
      .innerJoin(labels, and(eq(taskLabels.labelId, labels.id), eq(taskLabels.projectId, labels.projectId)))
      .where(eq(taskLabels.projectId, projectId))
      .orderBy(asc(labels.name), asc(labels.id)),
    db
      .select({
        taskId: taskAssignees.taskId,
        id: projectMembers.id,
        userId: users.id,
        workspaceMemberId: workspaceMembers.id,
        name: users.name,
        email: users.email,
      })
      .from(taskAssignees)
      .innerJoin(projectMembers, eq(taskAssignees.projectMemberId, projectMembers.id))
      .innerJoin(workspaceMembers, eq(projectMembers.workspaceMemberId, workspaceMembers.id))
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(
        and(
          eq(taskAssignees.projectId, projectId),
          isNull(projectMembers.removedAt),
          isNull(workspaceMembers.removedAt),
        ),
      )
      .orderBy(asc(taskAssignees.assignedAt), asc(projectMembers.id)),
    db
      .select({ editorsCanAssignTasks: projectSettings.editorsCanAssignTasks })
      .from(projectSettings)
      .where(eq(projectSettings.projectId, projectId))
      .limit(1),
  ])

  return {
    listRows,
    memberRows,
    taskRows,
    labelRows,
    taskLabelRows,
    taskAssigneeRows,
    settings: settingsRows[0] ?? null,
  }
}
