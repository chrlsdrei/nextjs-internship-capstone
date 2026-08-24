"use client"

import { useEffect, useRef } from "react"

import { recordPresenceAction } from "@/features/presence/actions/record-presence"

const HEARTBEAT_INTERVAL_MS = 60_000

export function PresenceHeartbeatController() {
  const pending = useRef(false)

  useEffect(() => {
    const sendHeartbeat = async () => {
      if (document.visibilityState !== "visible" || pending.current) return
      pending.current = true
      try {
        await recordPresenceAction()
      } catch {
        // Presence is best-effort and must never interrupt application use.
      } finally {
        pending.current = false
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void sendHeartbeat()
    }

    void sendHeartbeat()
    const intervalId = window.setInterval(() => void sendHeartbeat(), HEARTBEAT_INTERVAL_MS)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  return null
}
