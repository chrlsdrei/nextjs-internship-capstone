"use client"

import { BellRing, CalendarClock, CheckCheck, ClipboardCheck, MailPlus, MessageSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import type { NotificationDto, NotificationType } from "@/features/notifications/notification.types"
import { cn } from "@/lib/utils"

const notificationIcons = {
  workspace_invitation: MailPlus,
  project_invitation: MailPlus,
  task_assigned: ClipboardCheck,
  task_comment: MessageSquare,
  task_due_soon: CalendarClock,
} satisfies Record<NotificationType, typeof BellRing>

const notificationLabels = {
  workspace_invitation: "Workspace",
  project_invitation: "Board",
  task_assigned: "Assignment",
  task_comment: "Comment",
  task_due_soon: "Deadline",
} satisfies Record<NotificationType, string>

function notificationDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value))
}

export function NotificationCenter({
  open,
  notifications,
  unreadCount,
  isPending,
  error,
  onClose,
  onSelect,
  onMarkAllRead,
}: {
  open: boolean
  notifications: NotificationDto[]
  unreadCount: number
  isPending: boolean
  error: string | null
  onClose: () => void
  onSelect: (notification: NotificationDto) => void
  onMarkAllRead: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Notifications"
      description="Workspace invitations, assignments, comments, and approaching deadlines."
      className="max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-4">
          <p className="text-cyan-100/55 text-xs">
            {unreadCount === 0
              ? "You are all caught up."
              : `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
          </p>
          <Button type="button" variant="ghost" disabled={unreadCount === 0 || isPending} onClick={onMarkAllRead}>
            <CheckCheck size={16} /> Mark all read
          </Button>
        </div>
      }
    >
      {error && (
        <p className="mb-3 rounded-lg border border-red-300/35 bg-red-950/45 p-3 text-red-100 text-sm">{error}</p>
      )}
      {notifications.length === 0 ? (
        <div className="grid min-h-52 place-items-center rounded-xl border border-dashed border-cyan-300/25 bg-blue-950/35 p-8 text-center">
          <div>
            <BellRing className="mx-auto text-cyan-300/60" size={32} />
            <p className="mt-3 font-semibold text-white">No notifications yet</p>
            <p className="mt-1 text-cyan-100/55 text-sm">New activity will appear here automatically.</p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => {
            const Icon = notificationIcons[notification.type]
            const unread = notification.readAt === null
            return (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => onSelect(notification)}
                  className={cn(
                    "relative flex w-full gap-4 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                    unread
                      ? "border-cyan-300/45 bg-cyan-500/10 hover:bg-cyan-500/15"
                      : "border-blue-500/20 bg-blue-950/35 hover:border-cyan-300/30",
                  )}
                >
                  {unread && (
                    <>
                      <span className="sr-only">Unread. </span>
                      <span
                        aria-hidden="true"
                        className="absolute top-4 right-4 size-2 rounded-full bg-cyan-300 shadow-[0_0_10px_3px_rgba(34,211,238,0.7)]"
                      />
                    </>
                  )}
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-300/20">
                    <Icon size={19} />
                  </span>
                  <span className="min-w-0 flex-1 pr-4">
                    <span className="text-cyan-200/65 text-xs uppercase tracking-wider">
                      {notificationLabels[notification.type]}
                    </span>
                    <span className="mt-1 block font-semibold text-white">{notification.title}</span>
                    <span className="mt-1 block text-cyan-100/70 text-sm leading-relaxed">{notification.message}</span>
                    <span className="mt-2 block text-cyan-100/45 text-xs">
                      {notificationDate(notification.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
