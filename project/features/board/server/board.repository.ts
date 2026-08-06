import "server-only"

import { and, asc, eq, isNull } from "drizzle-orm"

import { db } from "@/server/db/client"
import { lists, projectMembers, projectSettings, tasks, users, workspaceMembers } from "@/server/db/schema"

export async function readProjectBoard(projectId: string) {
  const [listRows, memberRows, taskRows, settingsRows] = await Promise.all([
    db.select().from(lists).where(eq(lists.projectId, projectId)).orderBy(asc(lists.position), asc(lists.createdAt)),
    db
      .select({ id: users.id, name: users.name, email: users.email })
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
        assigneeId: users.id,
        assigneeName: users.name,
        assigneeEmail: users.email,
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .where(eq(tasks.projectId, projectId))
      .orderBy(asc(tasks.position), asc(tasks.createdAt)),
    db
      .select({ editorsCanAssignTasks: projectSettings.editorsCanAssignTasks })
      .from(projectSettings)
      .where(eq(projectSettings.projectId, projectId))
      .limit(1),
  ])

  return { listRows, memberRows, taskRows, settings: settingsRows[0] ?? null }
}
