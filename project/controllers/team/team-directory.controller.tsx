"use client"

import { useEffect, useRef, useState } from "react"

import { TeamDirectory } from "@/components/team/team-directory"
import { refreshTeamPresenceAction } from "@/features/presence/actions/refresh-team-presence"
import type { WorkspaceDetailDto } from "@/features/workspaces/workspace.types"

const PRESENCE_REFRESH_INTERVAL_MS = 30_000

export function TeamDirectoryController({ initialWorkspace }: { initialWorkspace: WorkspaceDetailDto }) {
  const [workspace, setWorkspace] = useState(initialWorkspace)
  const pending = useRef(false)

  useEffect(() => {
    const refreshPresence = async () => {
      if (document.visibilityState !== "visible" || pending.current) return
      pending.current = true
      try {
        const presence = await refreshTeamPresenceAction(initialWorkspace.id)
        const lastSeenByUserId = new Map(presence.map((record) => [record.userId, record.lastSeenAt]))
        setWorkspace((current) => ({
          ...current,
          members: current.members.map((member) => ({
            ...member,
            lastSeenAt: lastSeenByUserId.get(member.userId) ?? null,
          })),
        }))
      } catch {
        // Retain the most recent presence snapshot if a refresh fails.
      } finally {
        pending.current = false
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void refreshPresence()
    }

    void refreshPresence()
    const intervalId = window.setInterval(() => void refreshPresence(), PRESENCE_REFRESH_INTERVAL_MS)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [initialWorkspace.id])

  return <TeamDirectory workspace={workspace} />
}
