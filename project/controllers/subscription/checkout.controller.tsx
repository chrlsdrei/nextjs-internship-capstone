"use client"

import { CreditCard, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { CheckoutDialog } from "@/components/modals/billing/checkout-dialog"
import { ActionFeedback } from "@/components/ui/action-feedback"
import { startCheckoutAction } from "@/features/billing/actions/start-checkout"
import type { BillingPlanDto, StartCheckoutResult } from "@/features/billing/billing.types"
import { type ActionState, actionError, initialActionState } from "@/lib/action-state"
import { cn } from "@/lib/utils"

function formatPrice(plan: BillingPlanDto) {
  return (plan.amount / 100).toLocaleString("en-PH", {
    style: "currency",
    currency: plan.currency,
    maximumFractionDigits: 0,
  })
}

export function CheckoutController({
  plan,
  workspaceId,
  subjectName,
  label,
  disabledReason,
  className,
}: {
  plan: BillingPlanDto | null
  workspaceId?: string
  subjectName: string
  label: string
  disabledReason?: string
  className?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<ActionState<StartCheckoutResult>>(initialActionState)
  const idempotencyKey = useRef<string | null>(null)
  const checkoutResult = state.status === "success" ? state.data : undefined

  useEffect(() => {
    if (!checkoutResult) return
    router.refresh()
    let attempts = 0
    const interval = window.setInterval(() => {
      attempts += 1
      router.refresh()
      if (attempts >= 20) window.clearInterval(interval)
    }, 3_000)
    return () => window.clearInterval(interval)
  }, [checkoutResult, router])

  function closeDialog() {
    if (pending) return
    setOpen(false)
    setState(initialActionState)
    idempotencyKey.current = null
  }

  const disabled = !plan || Boolean(disabledReason)

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        title={disabledReason}
        onClick={() => {
          idempotencyKey.current = crypto.randomUUID()
          setState(initialActionState)
          setOpen(true)
        }}
        className={cn(
          "mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-cyan-300/60 bg-cyan-400 px-5 py-2.5 font-semibold text-blue-950 shadow-[0_0_16px_rgba(34,211,238,0.28)] transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-45",
          className,
        )}
      >
        <CreditCard aria-hidden="true" size={18} />
        {disabledReason ?? label}
      </button>

      {plan && (
        <CheckoutDialog
          open={open}
          onClose={closeDialog}
          title={plan.target === "workspace" ? "Purchase Workspace Pro" : "Purchase User Pro"}
          description="Review this one-time purchase before continuing to PayMongo."
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDialog}
                disabled={pending}
                className="rounded-lg px-4 py-2 text-cyan-100/75 hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              {checkoutResult ? (
                <a
                  href={checkoutResult.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 py-2 font-semibold text-blue-950 shadow-[0_0_14px_rgba(34,211,238,0.24)] hover:bg-cyan-300"
                >
                  <ExternalLink aria-hidden="true" size={17} />
                  Open PayMongo again
                </a>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    const checkoutWindow = window.open("about:blank", "_blank")
                    if (checkoutWindow) {
                      checkoutWindow.opener = null
                      checkoutWindow.document.title = "Opening PayMongo…"
                      checkoutWindow.document.body.textContent = "Opening secure PayMongo checkout…"
                    }
                    startTransition(async () => {
                      try {
                        if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID()
                        const result = await startCheckoutAction({
                          planId: plan.id,
                          workspaceId,
                          idempotencyKey: idempotencyKey.current,
                        })
                        setState(result)
                        if (result.status === "success" && result.data && checkoutWindow)
                          checkoutWindow.location.replace(result.data.checkoutUrl)
                        else if (result.status !== "success") checkoutWindow?.close()
                      } catch (error) {
                        checkoutWindow?.close()
                        setState(
                          actionError(error instanceof Error ? error.message : "Unable to open PayMongo checkout"),
                        )
                      }
                    })
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 py-2 font-semibold text-blue-950 shadow-[0_0_14px_rgba(34,211,238,0.24)] hover:bg-cyan-300 disabled:opacity-50"
                >
                  <ExternalLink aria-hidden="true" size={17} />
                  {pending ? "Opening PayMongo…" : "Continue to PayMongo"}
                </button>
              )}
            </div>
          }
        >
          <div className="space-y-5">
            <div className="rounded-xl border border-cyan-300/30 bg-blue-950/65 p-5">
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-cyan-100/60">Product</dt>
                  <dd className="mt-1 font-semibold text-white">{plan.name}</dd>
                </div>
                <div>
                  <dt className="text-cyan-100/60">Access for</dt>
                  <dd className="mt-1 font-semibold text-white">{subjectName}</dd>
                </div>
                <div>
                  <dt className="text-cyan-100/60">One-time price</dt>
                  <dd className="mt-1 font-semibold text-white">{formatPrice(plan)}</dd>
                </div>
                <div>
                  <dt className="text-cyan-100/60">Duration</dt>
                  <dd className="mt-1 font-semibold text-white">30 days</dd>
                </div>
              </dl>
            </div>
            <p className="text-cyan-100/70 text-sm">
              This purchase does not renew automatically. PayMongo securely collects all payment information on its
              hosted checkout page. ProjectFlow grants access only after receiving a verified payment webhook.
            </p>
            {checkoutResult && (
              <p className="rounded-lg border border-cyan-300/30 bg-cyan-950/55 p-3 text-cyan-50 text-sm" role="status">
                PayMongo opened in another tab so ProjectFlow remains available even if a wallet simulator does not
                redirect back. Complete payment there, then return to this tab; access will refresh automatically after
                the verified webhook arrives.
              </p>
            )}
            <ActionFeedback state={state} />
          </div>
        </CheckoutDialog>
      )}
    </>
  )
}
