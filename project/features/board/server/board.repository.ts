import "server-only"

import { asc, eq } from "drizzle-orm"

import { db } from "@/server/db/client"
import { lists, projectMembers, tasks, users } from "@/server/db/schema"

export async function readProjectBoard(projectId: string) {
  const [listRows, memberRows, taskRows] = await Promise.all([
    db.select().from(lists).where(eq(lists.projectId, projectId)).orderBy(asc(lists.position), asc(lists.createdAt)),
    db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId))
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
      .innerJoin(lists, eq(tasks.listId, lists.id))
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .where(eq(lists.projectId, projectId))
      .orderBy(asc(tasks.position), asc(tasks.createdAt)),
  ])

  return { listRows, memberRows, taskRows }
}
