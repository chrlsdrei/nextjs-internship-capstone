"use client"

import { Activity, LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrnamentalFrame } from "@/components/ui/ornamental-frame"
import { describeActivity } from "@/features/activity/activity.presenter"
import type { ActivityDto } from "@/features/activity/activity.types"

const timestampFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
})

export function ActivityHistory({
  items,
  hasMore,
  isLoading,
  error,
  onLoadMore,
}: {
  items: ActivityDto[]
  hasMore: boolean
  isLoading: boolean
  error: string | null
  onLoadMore: () => void
}) {
  return (
    <OrnamentalFrame variant="task" className="w-full" contentClassName="px-2 py-1 sm:px-4 sm:py-2">
      <section aria-labelledby="project-activity-heading">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="project-activity-heading" className="flex items-center gap-2 font-semibold text-lg text-white">
              <Activity aria-hidden="true" size={19} /> Activity
            </h2>
            <p className="mt-1 text-cyan-100/65 text-sm">Administrative and board changes, newest first.</p>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="mt-5 rounded-lg border border-cyan-300/30 border-dashed bg-blue-950/30 p-5 text-cyan-100/65 text-sm">
            No project activity has been recorded yet.
          </p>
        ) : (
          <ol className="mt-5 space-y-0">
            {items.map((item, index) => {
              const description = describeActivity(item)
              return (
                <li key={item.id} className="relative grid grid-cols-[1rem_1fr] gap-3 pb-5 last:pb-0">
                  {index < items.length - 1 && (
                    <span className="absolute top-3 bottom-0 left-[0.3rem] w-px bg-cyan-300/30" />
                  )}
                  <span className="relative mt-1.5 size-2.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgb(34_211_238/0.9)] ring-4 ring-blue-950/80" />
                  <div className="min-w-0">
                    <p className="font-medium text-cyan-50 text-sm">{description.title}</p>
                    {description.detail && (
                      <p className="mt-0.5 truncate text-cyan-100/65 text-sm">{description.detail}</p>
                    )}
                    <time dateTime={item.createdAt} className="mt-1 block text-cyan-100/55 text-xs">
                      {timestampFormatter.format(new Date(item.createdAt))} UTC
                    </time>
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        <p role="status" aria-live="polite" className="mt-4 text-red-300 text-sm">
          {error ?? ""}
        </p>
        {hasMore && (
          <Button
            type="button"
            variant="outline"
            className="mt-2 w-full border-cyan-300/40 bg-blue-950/45 text-cyan-50 hover:bg-blue-900/60 hover:text-white"
            disabled={isLoading}
            onClick={onLoadMore}
          >
            {isLoading && <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />}
            {isLoading ? "Loading activity…" : "Load older activity"}
          </Button>
        )}
      </section>
    </OrnamentalFrame>
  )
}
