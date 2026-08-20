"use client"

import type { ReactNode } from "react"

import { useProjectEvents } from "@/controllers/projects/board/use-project-events"

export function ProjectEventsController({ projectId, children }: { projectId: string; children: ReactNode }) {
  useProjectEvents(projectId)
  return children
}
