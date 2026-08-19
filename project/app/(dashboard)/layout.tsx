import { auth } from "@clerk/nextjs/server"
import type React from "react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { getAiNavigationData } from "@/features/ai/server/ai-generation.service"

export default async function ProtectedDashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await auth.protect()
  const ai = await getAiNavigationData()
  return <DashboardLayout ai={ai}>{children}</DashboardLayout>
}
