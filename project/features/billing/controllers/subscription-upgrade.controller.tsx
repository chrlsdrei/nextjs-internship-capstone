"use client"

import { ExternalLink } from "lucide-react"
import type { ReactNode } from "react"
import { useRef, useState, useTransition } from "react"

import { ActionFeedback } from "@/components/ui/action-feedback"
import { Modal } from "@/components/ui/modal"
import { startCheckoutAction } from "@/features/billing/actions/billing.actions"
import type { BillingPlanDto, StartCheckoutResult } from "@/features/billing/billing.types"
import { type ActionState, actionError, initialActionState } from "@/lib/action-state"

export function SubscriptionUpgradeController({
  plan,
  workspaceId,
  label = "Purchase Pro access",
  className,
  icon,
  labelClassName,
}: {
  plan: BillingPlanDto | null
  workspaceId?: string
  label?: string
  className?: string
  icon?: ReactNode
  labelClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<ActionState<StartCheckoutResult>>(initialActionState)
  const idempotencyKey = useRef<string | null>(null)

  function closeDialog() {
    if (pending) return
    setOpen(false)
    setState(initialActionState)
    idempotencyKey.current = null
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          idempotencyKey.current = crypto.randomUUID()
          setOpen(true)
        }}
        className={className}
        disabled={!plan}
      >
        {icon}
        <span className={labelClassName}>{label}</span>
      </button>
      <Modal
        open={open}
        onClose={closeDialog}
        title={plan?.target === "workspace" ? "Purchase Workspace Pro" : "Purchase User Pro"}
        description="PayMongo securely handles payment details on its hosted checkout page."
        className="max-w-xl"
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-cyan-300/30 bg-blue-950/60 p-5">
            <p className="font-semibold text-white">{plan?.name ?? "Product unavailable"}</p>
            {plan && (
              <p className="mt-1 text-cyan-100/75">
                {(plan.amount / 100).toLocaleString("en-PH", {
                  style: "currency",
                  currency: plan.currency,
                })}{" "}
                for 30 days of Pro access
              </p>
            )}
            <p className="mt-3 text-cyan-100/60 text-sm">
              This is a one-time purchase and does not renew automatically. Access is granted only after ProjectFlow
              receives PayMongo&apos;s verified payment webhook.
            </p>
          </div>
          <ActionFeedback state={state} />
          <div className="flex justify-end gap-3 border-cyan-300/20 border-t pt-4">
            <button
              type="button"
              onClick={closeDialog}
              disabled={pending}
              className="px-4 py-2 text-cyan-100/75 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending || !plan}
              onClick={() => {
                if (!plan) return
                startTransition(async () => {
                  try {
                    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID()
                    const result = await startCheckoutAction({
                      planId: plan.id,
                      workspaceId,
                      idempotencyKey: idempotencyKey.current,
                    })
                    setState(result)
                    if (result.status === "success" && result.data) {
                      window.location.assign(result.data.checkoutUrl)
                    }
                  } catch (error) {
                    setState(actionError(error instanceof Error ? error.message : "Unable to open PayMongo checkout"))
                  }
                })
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-blue-950 disabled:opacity-50"
            >
              <ExternalLink size={16} />
              {pending ? "Opening PayMongo…" : "Continue to PayMongo"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
