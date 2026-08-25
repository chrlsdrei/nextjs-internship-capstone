"use client"

import { Menu } from "lucide-react"
import type React from "react"
import { useState } from "react"

import { RealisticFogBackground } from "@/components/ui/realistic-fog-background"
import { PresenceHeartbeatController } from "@/controllers/global/presence-heartbeat.controller"
import { SidebarController } from "@/controllers/sidebar/sidebar.controller"
import type { UserAiEntitlementDto } from "@/features/billing/billing.types"
import type { NotificationCenterDto } from "@/features/notifications/notification.types"
import type { WorkspaceSummaryDto } from "@/features/workspaces/workspace.types"

export function DashboardLayout({
  children,
  ai,
  notifications,
  workspaceContext,
}: Readonly<{
  children: React.ReactNode
  ai: { entitlement: UserAiEntitlementDto; workspaces: Array<{ id: string; name: string }> }
  notifications: NotificationCenterDto
  workspaceContext: { activeWorkspace: WorkspaceSummaryDto | null; workspaces: WorkspaceSummaryDto[] }
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-[#020617]">
      <RealisticFogBackground className="fixed inset-0 z-0" />
      <PresenceHeartbeatController />
      <SidebarController
        ai={ai}
        collapsed={sidebarCollapsed}
        notifications={notifications}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
        open={sidebarOpen}
        workspaceContext={workspaceContext}
      />

      <div className={`relative z-10 transition-[padding] duration-300 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-30 cursor-pointer rounded-lg border border-cyan-300/35 bg-[#061326]/95 p-2.5 text-cyan-100 shadow-[0_0_14px_rgb(34_211_238/0.2)] backdrop-blur hover:bg-cyan-300/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 lg:hidden"
        >
          <Menu size={20} />
        </button>

        <main className="px-4 pt-20 pb-8 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
