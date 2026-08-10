"use client"

import { useEffect, useRef, useState, useTransition } from "react"

import { loadProjectActivityPageAction } from "@/features/activity/actions/activity.actions"
import type { ActivityPageDto } from "@/features/activity/activity.types"
import { mergeActivityItems } from "@/features/activity/activity-feed"
import { ActivityHistory } from "@/features/activity/components/activity-history"

export function ActivityHistoryController({
  projectId,
  initialPage,
}: {
  projectId: string
  initialPage: ActivityPageDto
}) {
  const [items, setItems] = useState(initialPage.items)
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const loadedOlderPages = useRef(false)

  useEffect(() => {
    setItems((current) => mergeActivityItems(initialPage.items, current))
    if (!loadedOlderPages.current) setNextCursor(initialPage.nextCursor)
  }, [initialPage])

  const loadMore = () => {
    if (!nextCursor || isPending) return
    setError(null)
    startTransition(async () => {
      try {
        const page = await loadProjectActivityPageAction({ projectId, cursor: nextCursor, limit: 30 })
        loadedOlderPages.current = true
        setItems((current) => mergeActivityItems(current, page.items))
        setNextCursor(page.nextCursor)
      } catch {
        setError("Activity could not be loaded. Please try again.")
      }
    })
  }

  return (
    <ActivityHistory
      items={items}
      hasMore={nextCursor !== null}
      isLoading={isPending}
      error={error}
      onLoadMore={loadMore}
    />
  )
}
