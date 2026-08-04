"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

type ProjectEventPayload = { projectId: string }

/** Revalidates the server-backed board after another local session commits a change. */
export function useProjectEvents(projectId: string) {
  const router = useRouter()
  const handledIds = useRef(new Set<string>())

  useEffect(() => {
    const eventSource = new EventSource(`/api/projects/${projectId}/events`)
    const onProjectEvent = (event: MessageEvent<string>) => {
      if (handledIds.current.has(event.lastEventId)) return
      handledIds.current.add(event.lastEventId)
      if (handledIds.current.size > 100) {
        const oldestId = handledIds.current.values().next().value
        if (oldestId) handledIds.current.delete(oldestId)
      }

      try {
        const payload = JSON.parse(event.data) as ProjectEventPayload
        if (payload.projectId !== projectId) return
        router.refresh()
      } catch {
        router.refresh()
      }
    }

    for (const eventName of ["board.sync", "board.updated", "members.updated", "project.updated", "project.deleted"])
      eventSource.addEventListener(eventName, onProjectEvent)

    return () => eventSource.close()
  }, [projectId, router])
}
