import type { ReactNode } from "react"

import { OrnamentalFrame } from "@/components/ui/ornamental-frame"
import type { BillingPlanDto } from "@/features/billing/billing.types"

type SubscriptionAccessCardProps = {
  plan: BillingPlanDto | null
  fallbackTitle: string
  highlighted: boolean
  benefits: string[]
  currentAccess?: string
  status?: {
    label: string
    detail: string
    purchaseMessage?: string | null
    resumeUrl?: string | null
  }
  checkout?: ReactNode
}

function formatPrice(plan: BillingPlanDto | null) {
  if (!plan) return "Currently unavailable"
  if (plan.amount === 0) return "Free"
  return `${(plan.amount / 100).toLocaleString("en-PH", {
    style: "currency",
    currency: plan.currency,
    maximumFractionDigits: 0,
  })} for 30 days`
}

export function SubscriptionAccessCard({
  plan,
  fallbackTitle,
  highlighted,
  benefits,
  currentAccess,
  status,
  checkout,
}: SubscriptionAccessCardProps) {
  return (
    <OrnamentalFrame
      title={plan?.name ?? fallbackTitle}
      isHighlighted={highlighted}
      contentClassName="flex h-full flex-col px-8 pb-8 pt-2 sm:px-12"
    >
      <p className="font-bold text-2xl text-white">{formatPrice(plan)}</p>
      <ul className="mt-5 flex-1 space-y-3 text-cyan-50/85">
        {benefits.map((benefit) => (
          <li key={benefit}>• {benefit}</li>
        ))}
      </ul>
      {currentAccess && <p className="mt-6 font-semibold text-cyan-300 text-sm">{currentAccess}</p>}
      {status && (
        <div className="mt-5 rounded-lg border border-cyan-300/20 bg-blue-950/55 p-4 text-sm">
          <p className="font-semibold text-cyan-200">{status.label}</p>
          <p className="mt-1 text-cyan-100/65">{status.detail}</p>
          {status.purchaseMessage && <p className="mt-2 text-amber-200">{status.purchaseMessage}</p>}
          {status.resumeUrl && (
            <a
              href={status.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex font-semibold text-cyan-300 underline decoration-cyan-300/45 underline-offset-4 hover:text-cyan-100"
            >
              Resume pending checkout
            </a>
          )}
        </div>
      )}
      {checkout}
    </OrnamentalFrame>
  )
}
