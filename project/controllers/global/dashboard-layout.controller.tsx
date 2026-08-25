"use client"

import { Menu } from "lucide-react"
import type React from "react"
import { useState } from "react"

import { RealisticFogBackground } from "@/components/ui/realistic-fog-background"
import { TaskFrame } from "@/components/ui/task-frame"
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
        <header className="sticky top-0 z-30 h-20 p-1.5">
          <TaskFrame
            className="h-full w-full rounded-xl"
            contentClassName="flex h-full items-center gap-x-4 px-4 py-0 sm:px-6 lg:px-8"
          >
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-cyan-100/75 hover:bg-cyan-300/15 hover:text-white lg:hidden"
            >
              <Menu size={20} />
            </button>
          </TaskFrame>
        </header>

        <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
