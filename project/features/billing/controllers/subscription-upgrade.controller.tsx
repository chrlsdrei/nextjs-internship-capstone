"use client"

import { CreditCard } from "lucide-react"
import type { ReactNode } from "react"
import { useState, useTransition } from "react"

import { ActionFeedback } from "@/components/ui/action-feedback"
import { Modal } from "@/components/ui/modal"
import { startSubscriptionAction } from "@/features/billing/actions/billing.actions"
import type { BillingPlanDto } from "@/features/billing/billing.types"
import { type ActionState, actionError, initialActionState } from "@/lib/action-state"

type CheckoutData = {
  nextActionUrl: string | null
  paymentIntentId: string | null
  clientKey: string | null
}

async function paymongoRequest(path: string, publicKey: string, body: unknown) {
  const response = await fetch(`https://api.paymongo.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${publicKey}:`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  const payload = (await response.json()) as {
    data?: { id: string; attributes: { status?: string; next_action?: { redirect?: { url?: string } } } }
    errors?: Array<{ detail?: string }>
  }
  if (!response.ok || !payload.data) throw new Error(payload.errors?.[0]?.detail ?? "PayMongo payment setup failed")
  return payload.data
}

async function completeInitialPayment(checkout: CheckoutData, formData: FormData) {
  if (checkout.nextActionUrl) {
    window.location.assign(checkout.nextActionUrl)
    return
  }
  if (!checkout.paymentIntentId || !checkout.clientKey) throw new Error("PayMongo did not return an initial payment")
  const publicKey = process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY
  if (!publicKey) throw new Error("PayMongo public key is not configured")
  const method = String(formData.get("paymentMethod"))
  const billing = {
    name: String(formData.get("billingName")),
    email: String(formData.get("billingEmail")),
    phone: String(formData.get("billingPhone")),
    address: {
      line1: String(formData.get("addressLine1")),
      city: String(formData.get("city")),
      state: String(formData.get("state")),
      postal_code: String(formData.get("postalCode")),
      country: "PH",
    },
  }
  const paymentMethod = await paymongoRequest("/payment_methods", publicKey, {
    data: {
      attributes: {
        type: method,
        ...(method === "card"
          ? {
              details: {
                card_number: String(formData.get("cardNumber")).replaceAll(" ", ""),
                exp_month: Number(formData.get("expMonth")),
                exp_year: Number(formData.get("expYear")),
                cvc: String(formData.get("cvc")),
              },
            }
          : {}),
        billing,
      },
    },
  })
  const intent = await paymongoRequest(`/payment_intents/${checkout.paymentIntentId}/attach`, publicKey, {
    data: {
      attributes: {
        payment_method: paymentMethod.id,
        client_key: checkout.clientKey,
        return_url: window.location.href,
      },
    },
  })
  const redirectUrl = intent.attributes.next_action?.redirect?.url
  if (redirectUrl) window.location.assign(redirectUrl)
}

export function SubscriptionUpgradeController({
  plan,
  workspaceId,
  label = "Upgrade",
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
  const [method, setMethod] = useState("card")
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<ActionState<CheckoutData>>(initialActionState)
  const fieldClass =
    "w-full rounded-lg border border-cyan-300/30 bg-blue-950/70 px-3 py-2 text-white [color-scheme:dark]"

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} disabled={!plan}>
        {icon}
        <span className={labelClassName}>{label}</span>
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={plan?.target === "workspace" ? "Upgrade workspace" : "Unlock Build with AI"}
        description="The subscription activates only after a verified PayMongo payment webhook."
        className="max-w-2xl"
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)
            if (!plan) return
            startTransition(async () => {
              try {
                const result = await startSubscriptionAction({
                  planId: plan.id,
                  workspaceId,
                  idempotencyKey: crypto.randomUUID(),
                })
                setState(result)
                if (result.status === "success" && result.data) await completeInitialPayment(result.data, formData)
              } catch (error) {
                setState(actionError(error instanceof Error ? error.message : "Payment setup failed"))
              }
            })
          }}
        >
          <div className="rounded-xl border border-cyan-300/30 bg-blue-950/60 p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="text-cyan-300" />
              <div>
                <p className="font-semibold text-white">{plan?.name ?? "Plan not configured"}</p>
                {plan && (
                  <p className="text-cyan-100/70 text-sm">
                    {(plan.amount / 100).toLocaleString("en-PH", { style: "currency", currency: plan.currency })} /{" "}
                    {plan.interval}
                  </p>
                )}
                <p className="mt-1 text-cyan-100/60 text-xs">30 days of unlimited Pro AI showcase access</p>
              </div>
            </div>
          </div>
          <label className="block text-sm">
            Payment method
            <select
              name="paymentMethod"
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              className={`mt-2 ${fieldClass}`}
            >
              <option value="card">Visa or Mastercard</option>
              <option value="paymaya">Maya</option>
            </select>
          </label>
          {method === "card" && (
            <div className="grid gap-3 sm:grid-cols-4">
              <input
                name="cardNumber"
                required
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="Card number"
                className={`sm:col-span-2 ${fieldClass}`}
              />
              <input
                name="expMonth"
                required
                inputMode="numeric"
                autoComplete="cc-exp-month"
                placeholder="MM"
                className={fieldClass}
              />
              <input
                name="expYear"
                required
                inputMode="numeric"
                autoComplete="cc-exp-year"
                placeholder="YYYY"
                className={fieldClass}
              />
              <input
                name="cvc"
                required
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="CVC"
                className={fieldClass}
              />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="billingName" required autoComplete="name" placeholder="Billing name" className={fieldClass} />
            <input
              name="billingEmail"
              required
              type="email"
              autoComplete="email"
              placeholder="Billing email"
              className={fieldClass}
            />
            <input
              name="billingPhone"
              required
              type="tel"
              autoComplete="tel"
              placeholder="Billing phone"
              className={fieldClass}
            />
            <input
              name="addressLine1"
              required
              autoComplete="address-line1"
              placeholder="Address"
              className={fieldClass}
            />
            <input name="city" required autoComplete="address-level2" placeholder="City" className={fieldClass} />
            <input
              name="state"
              required
              autoComplete="address-level1"
              placeholder="Province / region"
              className={fieldClass}
            />
            <input
              name="postalCode"
              required
              autoComplete="postal-code"
              placeholder="Postal code"
              className={fieldClass}
            />
          </div>
          <p className="text-cyan-100/60 text-xs">
            Card details go directly from this browser to PayMongo and are never sent to or stored by ProjectFlow.
            Billing contact details are payment-only and do not change Clerk sign-up data.
          </p>
          <ActionFeedback state={state} />
          <div className="flex justify-end gap-3 border-cyan-300/20 border-t pt-4">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-cyan-100/75">
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || !plan}
              className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-blue-950 disabled:opacity-50"
            >
              {pending ? "Opening payment…" : "Subscribe with PayMongo"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
