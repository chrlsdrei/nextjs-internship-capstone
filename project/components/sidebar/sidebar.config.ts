import { BarChart3, Calendar, CreditCard, FolderOpen, Home, Settings, Users } from "lucide-react"

import type { SidebarNavigationItem } from "@/components/sidebar/sidebar.types"

export const workspaceNavigation = [
  { kind: "link", name: "Dashboard", href: "/dashboard", icon: Home },
  { kind: "link", name: "Projects", href: "/projects", icon: FolderOpen },
  { kind: "link", name: "Team", href: "/team", icon: Users },
  { kind: "link", name: "Calendar", href: "/calendar", icon: Calendar },
  { kind: "link", name: "Analytics", href: "/analytics", icon: BarChart3 },
] satisfies SidebarNavigationItem[]

export const accountNavigation = [
  { kind: "link", name: "Subscription", href: "/subscription", icon: CreditCard },
  { kind: "notifications", name: "Notifications" },
  { kind: "link", name: "Settings", href: "/settings", icon: Settings },
] satisfies SidebarNavigationItem[]
