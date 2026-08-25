import type { LucideIcon } from "lucide-react"
import type React from "react"

export type SidebarLinkItem = {
  kind: "link"
  name: string
  href: string
  icon: LucideIcon
}

export type SidebarNotificationItem = {
  kind: "notifications"
  name: string
}

export type SidebarNavigationItem = SidebarLinkItem | SidebarNotificationItem

export type SidebarProps = {
  buildWithAi: React.ReactNode
  collapsed: boolean
  notifications: React.ReactNode
  onClose: () => void
  onToggleCollapsed: () => void
  open: boolean
  pathname: string
  workspaceSwitcher: React.ReactNode
}
