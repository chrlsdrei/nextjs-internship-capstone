"use client"

import { CreditCard } from "lucide-react"

import { TaskFrame } from "@/components/ui/task-frame"
import type { BillingAccessDto, BillingPlanDto } from "@/features/billing/billing.types"
import { SubscriptionUpgradeController } from "@/features/billing/controllers/subscription-upgrade.controller"

export function BillingPanelController({
  title,
  description,
  plans,
  access,
  workspaceId,
  canManage = true,
}: {
  title: string
  description: string
  plans: BillingPlanDto[]
  access: BillingAccessDto
  workspaceId?: string
  canManage?: boolean
}) {
  const paidPlan = plans.find((plan) => plan.amount > 0) ?? null

  return (
    <TaskFrame className="p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-cyan-200">
            <CreditCard size={20} />
            <h2 className="font-semibold text-xl text-white">{title}</h2>
          </div>
          <p className="mt-2 text-cyan-100/70">{description}</p>
          <p className="mt-3 text-cyan-100/75 text-sm">
            Current access: <span className="font-semibold capitalize text-cyan-200">{access.tier}</span>
            {access.periodEndsAt && ` · ends ${new Date(access.periodEndsAt).toLocaleDateString()}`}
          </p>
        </div>
        {canManage && (
          <SubscriptionUpgradeController
            plan={paidPlan}
            workspaceId={workspaceId}
            label={access.tier === "pro" ? "Add 30 days" : paidPlan ? "Purchase Pro" : "Product unavailable"}
            className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-blue-950 disabled:opacity-50"
          />
        )}
      </div>
      {!canManage && <p className="mt-4 text-cyan-100/65 text-sm">Only the workspace owner can purchase Pro access.</p>}
      <p className="mt-4 text-cyan-100/55 text-xs">
        Pro access is a one-time 30-day purchase and does not renew automatically.
      </p>
    </TaskFrame>
  )
}
