import { AlertTriangle, CalendarDays, ChevronRight, Clock3, FolderKanban, ListTodo } from "lucide-react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { TechFrameCard } from "@/components/ui/tech-frame-card"

const deadlineItems = [
  {
    status: "Today",
    date: "Aug 25",
    title: "Review AI launch board",
    context: "Product launch workspace",
    color: "border-cyan-300",
    statusColor: "text-cyan-300",
    Icon: ListTodo,
  },
  {
    status: "Tomorrow",
    date: "Aug 26",
    title: "Release readiness deadline",
    context: "QuestBoard launch",
    color: "border-blue-400",
    statusColor: "text-blue-300",
    Icon: FolderKanban,
  },
  {
    status: "Overdue",
    date: "Aug 24",
    title: "Resolve invitation QA",
    context: "Needs attention",
    color: "border-rose-300",
    statusColor: "text-rose-300",
    Icon: AlertTriangle,
  },
] as const

const events: Record<number, Array<{ title: string; source: "event" | "project" | "task" }>> = {
  18: [{ title: "Daily scrum", source: "event" }],
  20: [{ title: "AI task review", source: "task" }],
  24: [{ title: "Invitation QA", source: "task" }],
  25: [{ title: "Launch board review", source: "event" }],
  26: [
    { title: "Release readiness", source: "project" },
    { title: "Regression testing", source: "task" },
  ],
}

const sourceClasses = {
  event: "border-blue-300/45 bg-blue-500/25 text-blue-100",
  project: "border-violet-300/45 bg-violet-500/25 text-violet-100",
  task: "border-cyan-300/45 bg-cyan-500/25 text-cyan-100",
} as const

const calendarDays = Array.from({ length: 42 }, (_, index) => {
  const augustDay = index - 5
  if (augustDay <= 0) return { key: `july-${31 + augustDay}`, day: 31 + augustDay, currentMonth: false }
  if (augustDay > 31) return { key: `september-${augustDay - 31}`, day: augustDay - 31, currentMonth: false }
  return { key: `august-${augustDay}`, day: augustDay, currentMonth: true }
})

function MonthPreview() {
  return (
    <TechFrameCard
      className="min-h-0 min-w-0 w-full"
      contentClassName="min-h-0 gap-6 px-9 py-11 sm:px-12 sm:py-14 lg:px-14"
    >
      <div className="flex items-center justify-between border-cyan-300/20 border-b pb-5">
        <div className="flex items-center gap-3">
          <CalendarDays aria-hidden="true" className="text-cyan-300" size={21} />
          <div>
            <h3 className="font-semibold text-lg text-white">August 2026</h3>
            <p className="mt-1 text-cyan-100/55 text-xs">Tasks, projects, and workspace events in one view.</p>
          </div>
        </div>
        <ChevronRight aria-hidden="true" className="text-cyan-300/75" size={20} />
      </div>

      <ScrollArea orientation="horizontal" className="pb-3">
        <div className="min-w-[48rem]">
          <div className="grid grid-cols-7 border-cyan-300/20 border-b text-center font-semibold text-[0.65rem] text-cyan-200/65 uppercase tracking-wider">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => (
              <span key={weekday} className="py-3">
                {weekday}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 overflow-hidden rounded-b-lg border-cyan-300/20 border-r border-b">
            {calendarDays.map((date) => {
              const dayEvents = date.currentMonth ? (events[date.day] ?? []) : []
              const selected = date.currentMonth && date.day === 25

              return (
                <div
                  key={date.key}
                  className={`min-h-24 border-cyan-300/20 border-t border-l p-2 ${
                    selected ? "bg-cyan-400/10 shadow-[inset_0_0_18px_rgb(35_216_245/0.08)]" : "bg-[#020d1d]/70"
                  }`}
                >
                  <div className="flex justify-end">
                    <span
                      className={`grid size-6 place-items-center rounded-md text-xs ${
                        selected
                          ? "bg-cyan-300 font-bold text-blue-950 shadow-[0_0_12px_rgb(35_216_245/0.45)]"
                          : date.currentMonth
                            ? "text-cyan-50/75"
                            : "text-cyan-100/25"
                      }`}
                    >
                      {date.day}
                    </span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayEvents.map((event) => (
                      <span
                        key={`${date.key}-${event.title}`}
                        title={event.title}
                        className={`block truncate rounded border px-1.5 py-1 font-semibold text-[0.6rem] ${sourceClasses[event.source]}`}
                      >
                        {event.title}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-4 text-[0.65rem] text-cyan-100/55">
            {[
              { label: "Workspace event", color: "bg-blue-400" },
              { label: "Project deadline", color: "bg-violet-400" },
              { label: "Task deadline", color: "bg-cyan-300" },
            ].map((source) => (
              <span key={source.label} className="inline-flex items-center gap-2">
                <span className={`size-1.5 rounded-full ${source.color}`} /> {source.label}
              </span>
            ))}
          </div>
        </div>
      </ScrollArea>
    </TechFrameCard>
  )
}

export function Deadlines() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28" aria-labelledby="deadlines-heading">
      <div className="mx-auto grid max-w-[94rem] items-center gap-12 xl:grid-cols-[minmax(20rem,0.62fr)_minmax(0,1.38fr)] xl:gap-14">
        <div className="max-w-2xl">
          <p className="font-semibold text-[0.68rem] text-cyan-300 uppercase tracking-[0.24em]">04 / Deadlines</p>

          <h2
            id="deadlines-heading"
            className="mt-8 text-balance font-bold text-4xl text-white leading-[0.98] tracking-[-0.045em] sm:text-6xl xl:text-7xl"
          >
            Deadlines without
            <span className="block bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              the surprises.
            </span>
          </h2>

          <p className="mt-7 max-w-xl text-pretty text-base text-cyan-100/70 leading-8 sm:text-lg">
            Keep work visible and the team ahead of what comes next. Every task, project, and workspace event retains
            its context.
          </p>

          <div className="mt-10 space-y-3">
            {deadlineItems.map((item) => (
              <article
                key={item.title}
                className={`grid grid-cols-[auto_1fr] gap-4 border-l-2 py-3 pl-4 ${item.color}`}
              >
                <item.Icon aria-hidden="true" className={`mt-1 ${item.statusColor}`} size={17} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className={`font-semibold text-[0.62rem] uppercase tracking-wider ${item.statusColor}`}>
                      {item.status}
                    </span>
                    <time className="text-cyan-100/45 text-xs">{item.date}</time>
                  </div>
                  <h3 className="mt-2 font-semibold text-sm text-white">{item.title}</h3>
                  <p className="mt-1 text-cyan-100/50 text-xs">{item.context}</p>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-8 inline-flex items-center gap-2 text-cyan-100/55 text-sm">
            <Clock3 aria-hidden="true" className="text-cyan-300" size={16} /> Upcoming deadlines also power timely
            notifications.
          </p>
        </div>

        <MonthPreview />
      </div>
    </section>
  )
}
