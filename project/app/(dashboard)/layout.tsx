import { auth } from "@clerk/nextjs/server"
import type React from "react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { getAiNavigationData } from "@/features/ai/server/ai-generation.service"
import { getBillingPlans } from "@/features/billing/server/billing.service"

export default async function ProtectedDashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await auth.protect()
  const [ai, plans] = await Promise.all([getAiNavigationData(), getBillingPlans()])
  return (
    <DashboardLayout ai={ai} userAiPlan={plans.find((plan) => plan.target === "user" && plan.amount > 0) ?? null}>
      {children}
    </DashboardLayout>
  )
}
