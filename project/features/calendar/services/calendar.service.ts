import "server-only"

import { getCurrentDatabaseUser } from "@/features/auth/services/session.service"
import { requireWorkspaceWritable } from "@/features/billing/services/entitlement.service"
import { createCalendarEventSchema } from "@/features/calendar/calendar.schema"
import type { CalendarItemDto, CalendarPageDto } from "@/features/calendar/calendar.types"
import {
  insertCalendarEvent,
  listAccessibleTaskDeadlines,
  listWorkspaceCalendarEvents,
} from "@/features/calendar/repositories/calendar.repository"
import { listAccessibleProjects } from "@/features/projects/repositories/project.repository"
import { enforceRateLimit } from "@/features/rate-limits/services/rate-limit.service"
import {
  findActiveWorkspaceAccess,
  listActiveWorkspaceMemberships,
} from "@/features/workspaces/repositories/workspace.repository"

function nextDay(value: Date) {
  const result = new Date(value)
  result.setUTCDate(result.getUTCDate() + 1)
  return result
}

export async function getCalendarPageData(): Promise<CalendarPageDto> {
  const user = await getCurrentDatabaseUser()
  const [memberships, accessibleProjects] = await Promise.all([
    listActiveWorkspaceMemberships(user.id),
    listAccessibleProjects(user.id),
  ])
  const activeMemberships = memberships.filter((workspace) => workspace.status === "active")
  const [events, taskDeadlines] = await Promise.all([
    listWorkspaceCalendarEvents(activeMemberships.map((workspace) => workspace.id)),
    listAccessibleTaskDeadlines(accessibleProjects.map((project) => project.id)),
  ])
  const items: CalendarItemDto[] = [
    ...events.map((event) => ({
      id: `event:${event.id}`,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
      allDay: event.allDay,
      source: "event" as const,
      workspaceId: event.workspaceId,
      workspaceName: event.workspaceName,
      projectId: null,
      projectTitle: null,
    })),
    ...accessibleProjects.flatMap((project) =>
      project.dueDate
        ? [
            {
              id: `project:${project.id}`,
              title: `${project.title} deadline`,
              description: project.description,
              startsAt: project.dueDate.toISOString(),
              endsAt: nextDay(project.dueDate).toISOString(),
              allDay: true,
              source: "project" as const,
              workspaceId: project.workspaceId,
              workspaceName:
                activeMemberships.find((workspace) => workspace.id === project.workspaceId)?.name ?? "Workspace",
              projectId: project.id,
              projectTitle: project.title,
            },
          ]
        : [],
    ),
    ...taskDeadlines.flatMap((task) =>
      task.dueDate
        ? [
            {
              id: `task:${task.id}`,
              title: task.title,
              description: task.description ?? `Task in ${task.listName}`,
              startsAt: task.dueDate.toISOString(),
              endsAt: nextDay(task.dueDate).toISOString(),
              allDay: true,
              source: "task" as const,
              workspaceId: task.workspaceId,
              workspaceName: task.workspaceName,
              projectId: task.projectId,
              projectTitle: task.projectTitle,
            },
          ]
        : [],
    ),
  ]
  return {
    items: items.sort((left, right) => left.startsAt.localeCompare(right.startsAt)),
    workspaces: activeMemberships.map((workspace) => ({ id: workspace.id, name: workspace.name })),
  }
}

export async function createCalendarEvent(input: unknown): Promise<CalendarItemDto> {
  const values = createCalendarEventSchema.parse(input)
  const user = await getCurrentDatabaseUser()
  const workspace = await findActiveWorkspaceAccess(values.workspaceId, user.id)
  if (workspace?.status !== "active") throw new Error("You cannot add events to this workspace")
  await requireWorkspaceWritable(workspace.id, user.id)
  await enforceRateLimit({ action: "calendar.event.create", actorUserId: user.id, workspaceId: workspace.id })
  const event = await insertCalendarEvent(workspace.membershipId, values)
  if (!event) throw new Error("Unable to create the event")
  return {
    id: `event:${event.id}`,
    title: event.title,
    description: event.description,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    allDay: event.allDay,
    source: "event",
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    projectId: null,
    projectTitle: null,
  }
}
