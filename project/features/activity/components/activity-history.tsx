"use client"

import { Activity, LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    <section
      aria-labelledby="project-activity-heading"
      className="rounded-xl border border-french-gray-300 bg-white p-5 shadow-sm dark:border-paynes-gray-400 dark:bg-outer-space-500"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="project-activity-heading" className="flex items-center gap-2 text-lg font-semibold">
            <Activity aria-hidden="true" size={19} /> Activity
          </h2>
          <p className="mt-1 text-sm text-paynes-gray-500 dark:text-french-gray-400">
            Administrative and board changes, newest first.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="mt-5 rounded-lg border border-dashed border-french-gray-300 p-5 text-sm text-paynes-gray-500 dark:border-paynes-gray-400 dark:text-french-gray-400">
          No project activity has been recorded yet.
        </p>
      ) : (
        <ol className="mt-5 space-y-0">
          {items.map((item, index) => {
            const description = describeActivity(item)
            return (
              <li key={item.id} className="relative grid grid-cols-[1rem_1fr] gap-3 pb-5 last:pb-0">
                {index < items.length - 1 && (
                  <span className="absolute top-3 bottom-0 left-[0.3rem] w-px bg-french-gray-300 dark:bg-paynes-gray-400" />
                )}
                <span className="relative mt-1.5 size-2.5 rounded-full bg-blue-munsell-500 ring-4 ring-white dark:ring-outer-space-500" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-outer-space-500 dark:text-platinum-500">{description.title}</p>
                  {description.detail && (
                    <p className="mt-0.5 truncate text-sm text-paynes-gray-500 dark:text-french-gray-400">
                      {description.detail}
                    </p>
                  )}
                  <time
                    dateTime={item.createdAt}
                    className="mt-1 block text-xs text-paynes-gray-500 dark:text-french-gray-400"
                  >
                    {timestampFormatter.format(new Date(item.createdAt))} UTC
                  </time>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <p role="status" aria-live="polite" className="mt-4 text-sm text-red-600 dark:text-red-400">
        {error ?? ""}
      </p>
      {hasMore && (
        <Button type="button" variant="outline" className="mt-2 w-full" disabled={isLoading} onClick={onLoadMore}>
          {isLoading && <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />}
          {isLoading ? "Loading activity…" : "Load older activity"}
        </Button>
      )}
    </section>
  )
}
