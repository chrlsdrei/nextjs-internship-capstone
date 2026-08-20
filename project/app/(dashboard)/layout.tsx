import { auth } from "@clerk/nextjs/server"
import type React from "react"

import { DashboardLayout } from "@/controllers/global/dashboard-layout.controller"
import { getAiNavigationData } from "@/features/ai/queries/get-ai-navigation-data"
import { getNotificationCenterData } from "@/features/notifications/queries/get-notification-center-data"

export default async function ProtectedDashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await auth.protect()
  const [ai, notifications] = await Promise.all([getAiNavigationData(), getNotificationCenterData()])
  return (
    <DashboardLayout ai={ai} notifications={notifications}>
      {children}
    </DashboardLayout>
  )
}
