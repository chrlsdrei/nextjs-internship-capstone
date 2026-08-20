import { auth } from "@clerk/nextjs/server"
import type React from "react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { getAiNavigationData } from "@/features/ai/server/ai-generation.service"
import { getNotificationCenterData } from "@/features/notifications/server/notification.service"

export default async function ProtectedDashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await auth.protect()
  const [ai, notifications] = await Promise.all([getAiNavigationData(), getNotificationCenterData()])
  return (
    <DashboardLayout ai={ai} notifications={notifications}>
      {children}
    </DashboardLayout>
  )
}
