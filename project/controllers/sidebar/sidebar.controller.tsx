"use client"

import { usePathname } from "next/navigation"

import { Sidebar } from "@/components/sidebar/sidebar"
import { BuildAiController } from "@/controllers/sidebar/build-ai.controller"
import { NotificationCenterController } from "@/controllers/sidebar/notification-center.controller"
import { WorkspaceSwitcherController } from "@/controllers/sidebar/workspace-switcher.controller"
import type { UserAiEntitlementDto } from "@/features/billing/billing.types"
import type { NotificationCenterDto } from "@/features/notifications/notification.types"
import type { WorkspaceSummaryDto } from "@/features/workspaces/workspace.types"

export function SidebarController({
  ai,
  collapsed,
  notifications,
  onClose,
  onToggleCollapsed,
  open,
  workspaceContext,
}: {
  ai: { entitlement: UserAiEntitlementDto; workspaces: Array<{ id: string; name: string }> }
  collapsed: boolean
  notifications: NotificationCenterDto
  onClose: () => void
  onToggleCollapsed: () => void
  open: boolean
  workspaceContext: { activeWorkspace: WorkspaceSummaryDto | null; workspaces: WorkspaceSummaryDto[] }
}) {
  const pathname = usePathname()

  return (
    <Sidebar
      buildWithAi={<BuildAiController collapsed={collapsed} entitlement={ai.entitlement} workspaces={ai.workspaces} />}
      collapsed={collapsed}
      notifications={<NotificationCenterController collapsed={collapsed} initialData={notifications} />}
      onClose={onClose}
      onToggleCollapsed={onToggleCollapsed}
      open={open}
      pathname={pathname}
      workspaceSwitcher={
        <WorkspaceSwitcherController
          activeWorkspace={workspaceContext.activeWorkspace}
          collapsed={collapsed}
          onNavigate={onClose}
          workspaces={workspaceContext.workspaces}
        />
      }
    />
  )
}
