"use client"

import type { ReactNode } from "react"

import { useProjectEvents } from "@/features/board/controllers/use-project-events"

export function ProjectEventsController({ projectId, children }: { projectId: string; children: ReactNode }) {
  useProjectEvents(projectId)
  return children
}
