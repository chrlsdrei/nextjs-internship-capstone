"use client"

import { CreditCard, Sparkles } from "lucide-react"
import { useState, useTransition } from "react"

import { ActionFeedback } from "@/components/ui/action-feedback"
import { Modal } from "@/components/ui/modal"
import { TaskFrame } from "@/components/ui/task-frame"
import { cancelSubscriptionAction } from "@/features/billing/actions/billing.actions"
import type { BillingPlanDto, SubscriptionDto } from "@/features/billing/billing.types"
import { SubscriptionUpgradeController } from "@/features/billing/controllers/subscription-upgrade.controller"
import { type ActionState, initialActionState } from "@/lib/action-state"

export function BillingPanelController({
  title,
  description,
  plans,
  subscription,
  workspaceId,
  canManage = true,
}: {
  title: string
  description: string
  plans: BillingPlanDto[]
  subscription: SubscriptionDto | null
  workspaceId?: string
  canManage?: boolean
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<ActionState>(initialActionState)
  const paidPlan = plans.find((plan) => plan.amount > 0) ?? null
  const cancellable = subscription && ["active", "past_due", "incomplete"].includes(subscription.status)

  return (
    <TaskFrame className="p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-cyan-200">
            <CreditCard size={20} />
            <h2 className="font-semibold text-xl text-white">{title}</h2>
          </div>
          <p className="mt-2 text-cyan-100/70">{description}</p>
          {subscription && (
            <p className="mt-3 text-sm text-cyan-100/75">
              {subscription.plan.name} · <span className="capitalize">{subscription.status.replaceAll("_", " ")}</span>
            </p>
          )}
        </div>
        {canManage && !cancellable && (
          <SubscriptionUpgradeController
            plan={paidPlan}
            workspaceId={workspaceId}
            label={paidPlan ? "Choose paid plan" : "Plan unavailable"}
            className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-blue-950 disabled:opacity-50"
          />
        )}
        {canManage && cancellable && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="rounded-lg border border-red-400/50 px-4 py-2 font-semibold text-red-200"
          >
            Cancel subscription
          </button>
        )}
      </div>
      {!canManage && (
        <p className="mt-4 text-sm text-cyan-100/65">Only the workspace owner can manage this subscription.</p>
      )}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Cancel subscription immediately?"
        description="Paid AI access and higher limits end as soon as PayMongo confirms cancellation. Existing data is retained."
        footer={
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setConfirmOpen(false)} className="px-4 py-2 text-cyan-100/75">
              Keep subscription
            </button>
            <button
              type="button"
              disabled={pending || !subscription}
              onClick={() => {
                if (!subscription) return
                startTransition(async () => {
                  const result = await cancelSubscriptionAction({
                    subscriptionId: subscription.id,
                    reason: "other",
                  })
                  setState(result)
                  if (result.status === "success") setConfirmOpen(false)
                })
              }}
              className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Cancelling…" : "Cancel now"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-3 rounded-xl border border-amber-300/30 bg-amber-950/30 p-4 text-amber-100">
            <Sparkles className="shrink-0" />
            <p>This action does not delete projects, tasks, summaries, or generated content.</p>
          </div>
          <ActionFeedback state={state} />
        </div>
      </Modal>
    </TaskFrame>
  )
}
