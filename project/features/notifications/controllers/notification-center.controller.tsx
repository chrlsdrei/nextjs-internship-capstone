"use client"

import { Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState, useTransition } from "react"

import {
  loadNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions/notification.actions"
import { NotificationCenter } from "@/features/notifications/components/notification-center"
import type { NotificationCenterDto, NotificationDto } from "@/features/notifications/notification.types"

const POLL_INTERVAL_MS = 30_000

export function NotificationCenterController({ initialData }: { initialData: NotificationCenterDto }) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const refreshing = useRef(false)
  const openRef = useRef(open)

  useEffect(() => {
    openRef.current = open
  }, [open])

  const refresh = useCallback(() => {
    if (refreshing.current) return
    refreshing.current = true
    startTransition(async () => {
      try {
        setData(await loadNotificationsAction())
        setError(null)
      } catch {
        if (openRef.current) setError("Notifications could not be refreshed. Please try again.")
      } finally {
        refreshing.current = false
      }
    })
  }, [])

  useEffect(() => {
    const interval = window.setInterval(refresh, POLL_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [refresh])

  const openCenter = () => {
    setOpen(true)
    refresh()
  }

  const selectNotification = (notification: NotificationDto) => {
    setData((current) => ({
      items: current.items.map((item) =>
        item.id === notification.id && item.readAt === null ? { ...item, readAt: new Date().toISOString() } : item,
      ),
      unreadCount: notification.readAt === null ? Math.max(0, current.unreadCount - 1) : current.unreadCount,
    }))
    startTransition(async () => {
      try {
        setData(await markNotificationReadAction(notification.id))
      } catch {
        refresh()
      }
    })
    if (notification.href) {
      setOpen(false)
      router.push(notification.href)
    }
  }

  const markAllRead = () => {
    const markedAt = new Date().toISOString()
    setData((current) => ({
      items: current.items.map((item) => ({ ...item, readAt: item.readAt ?? markedAt })),
      unreadCount: 0,
    }))
    startTransition(async () => {
      try {
        setData(await markAllNotificationsReadAction())
      } catch {
        setError("Notifications could not be marked as read.")
        refresh()
      }
    })
  }

  return (
    <>
      <button
        type="button"
        aria-label={data.unreadCount > 0 ? `Notifications, ${data.unreadCount} unread` : "Notifications"}
        aria-haspopup="dialog"
        onClick={openCenter}
        className="relative rounded-lg p-2 text-cyan-100/75 transition-colors hover:bg-cyan-300/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      >
        <Bell size={20} />
        {data.unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 size-2.5 rounded-full border border-blue-950 bg-cyan-300 shadow-[0_0_9px_3px_rgba(34,211,238,0.8)]"
          />
        )}
      </button>
      <NotificationCenter
        open={open}
        notifications={data.items}
        unreadCount={data.unreadCount}
        isPending={isPending}
        error={error}
        onClose={() => setOpen(false)}
        onSelect={selectNotification}
        onMarkAllRead={markAllRead}
      />
    </>
  )
}
