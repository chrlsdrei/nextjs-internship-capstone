import { CalendarController } from "@/controllers/calendar/calendar.controller"
import { getCalendarPageData } from "@/features/calendar/queries/get-calendar-page-data"

export default async function CalendarPage() {
  const data = await getCalendarPageData()
  return (
    <div className="mx-auto max-w-[112rem]">
      <CalendarController initialData={data} />
    </div>
  )
}
