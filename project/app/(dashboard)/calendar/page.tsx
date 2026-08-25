import { WorkspaceEmptyState } from "@/components/workspaces/workspace-empty-state"
import { CalendarController } from "@/controllers/calendar/calendar.controller"
import { getCalendarPageData } from "@/features/calendar/queries/get-calendar-page-data"
import { getActiveWorkspaceContext } from "@/features/workspaces/queries/get-active-workspace-context"

export default async function CalendarPage() {
  const { activeWorkspace } = await getActiveWorkspaceContext()
  if (!activeWorkspace) return <WorkspaceEmptyState />
  const data = await getCalendarPageData(activeWorkspace.id)
  return (
    <div className="mx-auto max-w-[112rem]">
      <CalendarController key={activeWorkspace.id} initialData={data} />
    </div>
  )
}
