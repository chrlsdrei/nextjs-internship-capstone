import { auth } from "@clerk/nextjs/server"
import type React from "react"

import { DashboardLayout } from "@/controllers/global/dashboard-layout.controller"
import { getAiNavigationData } from "@/features/ai/queries/get-ai-navigation-data"
import { getNotificationCenterData } from "@/features/notifications/queries/get-notification-center-data"
import { getActiveWorkspaceContext } from "@/features/workspaces/queries/get-active-workspace-context"

export default async function ProtectedDashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await auth.protect()
  const [ai, notifications, workspaceContext] = await Promise.all([
    getAiNavigationData(),
    getNotificationCenterData(),
    getActiveWorkspaceContext(),
  ])
  const activeWorkspaceId = workspaceContext.activeWorkspace?.id
  return (
    <DashboardLayout
      ai={{
        ...ai,
        workspaces: activeWorkspaceId ? ai.workspaces.filter((workspace) => workspace.id === activeWorkspaceId) : [],
      }}
      notifications={notifications}
      workspaceContext={workspaceContext}
    >
      {children}
    </DashboardLayout>
  )
}
