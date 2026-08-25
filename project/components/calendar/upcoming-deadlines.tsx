import { CalendarClock, FolderKanban, ListTodo, Sparkles } from "lucide-react"
import Link from "next/link"

import { OrnamentalFrame } from "@/components/ui/ornamental-frame"
import type { CalendarItemDto } from "@/features/calendar/calendar.types"

const formatter = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" })

function sourceDetails(item: CalendarItemDto) {
  if (item.source === "project") return { label: "Project deadline", Icon: FolderKanban }
  if (item.source === "task") return { label: "Task deadline", Icon: ListTodo }
  return { label: "Workspace event", Icon: Sparkles }
}

export function UpcomingDeadlines({ items }: { items: CalendarItemDto[] }) {
  const upcoming = items
    .filter((item) => new Date(item.endsAt).getTime() >= Date.now())
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
    .slice(0, 10)
  return (
    <OrnamentalFrame
      title="Upcoming deadlines"
      className="min-w-0"
      contentClassName="min-w-0 overflow-hidden px-5 pb-7 pt-2 sm:px-10 lg:px-14"
    >
      {upcoming.length === 0 ? (
        <div className="flex min-h-32 flex-col items-center justify-center text-center text-cyan-100/65">
          <CalendarClock className="mb-3 size-8 text-cyan-300" />
          <p>No upcoming events or deadlines.</p>
        </div>
      ) : (
        <ol className="grid min-w-0 gap-3 xl:grid-cols-2">
          {upcoming.map((item) => {
            const { label, Icon } = sourceDetails(item)
            const content = (
              <div className="flex h-full min-w-0 items-start gap-2.5 overflow-hidden rounded-lg border border-cyan-400/25 bg-[#041426]/85 p-3 transition hover:border-cyan-300/70 hover:bg-[#08213c] sm:gap-3 sm:p-4">
                <div className="shrink-0 rounded-md bg-cyan-400/10 p-2 text-cyan-300">
                  <Icon className="size-4 sm:size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-cyan-50">{item.title}</p>
                  <p className="mt-1 truncate text-cyan-100/60 text-xs" title={`${label} · ${item.workspaceName}`}>
                    {label} · {item.workspaceName}
                  </p>
                  <time className="mt-2 block text-cyan-200 text-sm" dateTime={item.startsAt}>
                    {item.allDay
                      ? new Date(item.startsAt).toLocaleDateString()
                      : formatter.format(new Date(item.startsAt))}
                  </time>
                </div>
              </div>
            )
            return (
              <li key={item.id} className="min-w-0">
                {item.projectId ? (
                  <Link href={`/projects/${item.projectId}`} className="block min-w-0">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            )
          })}
        </ol>
      )}
    </OrnamentalFrame>
  )
}
