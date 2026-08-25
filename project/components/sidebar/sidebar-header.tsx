import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react"
import Link from "next/link"

import { BrandLogo } from "@/components/global/brand-logo"

export function SidebarHeader({
  collapsed,
  onClose,
  onToggleCollapsed,
}: {
  collapsed: boolean
  onClose: () => void
  onToggleCollapsed: () => void
}) {
  return (
    <div
      className={`flex h-16 items-center border-cyan-300/20 border-b ${
        collapsed ? "justify-between px-6 lg:justify-center lg:gap-1 lg:px-2" : "justify-between px-6"
      }`}
    >
      <Link href="/" aria-label="QuestBoard home" className={collapsed ? "lg:hidden" : undefined}>
        <BrandLogo priority />
      </Link>
      <button
        type="button"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={onToggleCollapsed}
        className={`hidden cursor-pointer rounded-lg text-cyan-100/70 transition-colors hover:bg-cyan-300/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 lg:inline-flex ${
          collapsed ? "p-1.5" : "p-2"
        }`}
      >
        {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
      </button>
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="cursor-pointer rounded-lg p-2 text-cyan-100/70 hover:bg-cyan-300/15 hover:text-white lg:hidden"
      >
        <X size={20} />
      </button>
    </div>
  )
}
