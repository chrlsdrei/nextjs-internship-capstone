import Link from "next/link"

import type { SidebarLinkItem } from "@/components/sidebar/sidebar.types"

export function SidebarNavItem({
  collapsed,
  isActive,
  item,
  onNavigate,
}: {
  collapsed: boolean
  isActive: boolean
  item: SidebarLinkItem
  onNavigate: () => void
}) {
  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      aria-label={collapsed ? item.name : undefined}
      title={collapsed ? item.name : undefined}
      onClick={onNavigate}
      className={`flex cursor-pointer items-center rounded-lg px-3 py-2 font-medium text-sm transition-colors ${
        collapsed ? "lg:justify-center lg:px-2" : ""
      } ${
        isActive
          ? "bg-cyan-400/20 text-cyan-100 ring-1 ring-cyan-300/35"
          : "text-cyan-50/80 hover:bg-cyan-300/10 hover:text-white"
      }`}
    >
      <item.icon className={collapsed ? "mr-3 lg:mr-0" : "mr-3"} size={20} />
      <span className={collapsed ? "lg:sr-only" : undefined}>{item.name}</span>
    </Link>
  )
}
