import { RealisticFogBackground } from "@/components/ui/realistic-fog-background"
import { CalendarController } from "@/controllers/calendar/calendar.controller"
import { getCalendarPageData } from "@/features/calendar/queries/get-calendar-page-data"

export default async function CalendarPage() {
  const data = await getCalendarPageData()
  return (
    <div className="relative isolate min-h-full overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <RealisticFogBackground className="fixed inset-0 -z-20" />
      <div className="relative z-10 mx-auto max-w-[112rem]">
        <CalendarController initialData={data} />
      </div>
    </div>
  )
}
