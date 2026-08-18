export type CalendarItemSource = "event" | "project" | "task"

export type CalendarItemDto = {
  id: string
  title: string
  description: string | null
  startsAt: string
  endsAt: string
  allDay: boolean
  source: CalendarItemSource
  workspaceId: string
  workspaceName: string
  projectId: string | null
  projectTitle: string | null
}

export type CalendarWorkspaceDto = {
  id: string
  name: string
}

export type CalendarPageDto = {
  items: CalendarItemDto[]
  workspaces: CalendarWorkspaceDto[]
}
