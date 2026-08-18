import "server-only"

import { asc, eq, inArray } from "drizzle-orm"

import type { CreateCalendarEventInput } from "@/features/calendar/calendar.schema"
import { db } from "@/server/db/client"
import { calendarEvents, lists, projects, tasks, workspaces } from "@/server/db/schema"

export async function listWorkspaceCalendarEvents(workspaceIds: string[]) {
  if (workspaceIds.length === 0) return []
  return db
    .select({
      id: calendarEvents.id,
      workspaceId: calendarEvents.workspaceId,
      workspaceName: workspaces.name,
      title: calendarEvents.title,
      description: calendarEvents.description,
      startsAt: calendarEvents.startsAt,
      endsAt: calendarEvents.endsAt,
      allDay: calendarEvents.allDay,
    })
    .from(calendarEvents)
    .innerJoin(workspaces, eq(workspaces.id, calendarEvents.workspaceId))
    .where(inArray(calendarEvents.workspaceId, workspaceIds))
    .orderBy(asc(calendarEvents.startsAt))
}

export async function listAccessibleTaskDeadlines(projectIds: string[]) {
  if (projectIds.length === 0) return []
  return db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      dueDate: tasks.dueDate,
      projectId: projects.id,
      projectTitle: projects.title,
      workspaceId: projects.workspaceId,
      workspaceName: workspaces.name,
      listName: lists.name,
    })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .innerJoin(workspaces, eq(workspaces.id, projects.workspaceId))
    .innerJoin(lists, eq(lists.id, tasks.listId))
    .where(inArray(tasks.projectId, projectIds))
    .orderBy(asc(tasks.dueDate))
}

export async function insertCalendarEvent(workspaceMemberId: string, input: CreateCalendarEventInput) {
  const [event] = await db
    .insert(calendarEvents)
    .values({
      workspaceId: input.workspaceId,
      createdByWorkspaceMemberId: workspaceMemberId,
      title: input.title,
      description: input.description,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      allDay: input.allDay,
    })
    .returning()
  return event ?? null
}
