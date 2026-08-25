import { z } from "zod"

import { TechFrameCard } from "@/components/ui/tech-frame-card"
import {
  type CheckoutReturnState,
  SubscriptionPageController,
} from "@/controllers/subscription/subscription-page.controller"
import { getSubscriptionPageData } from "@/features/billing/queries/get-subscription-page-data"

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string | string[]; purchase?: string | string[] }>
}) {
  const [data, query] = await Promise.all([getSubscriptionPageData(), searchParams])
  const checkoutReturn: CheckoutReturnState =
    query.checkout === "success" || query.checkout === "cancelled" ? query.checkout : null
  const purchaseResult = z.uuid().safeParse(query.purchase)
  const checkoutPurchaseId = purchaseResult.success ? purchaseResult.data : null

  return (
    <div className="space-y-6">
      <TechFrameCard
        className="min-h-0 w-full"
        contentClassName="min-h-0 gap-0 px-[clamp(2.5rem,5vw,6rem)] py-6 sm:min-h-0 sm:px-[clamp(2.5rem,5vw,6rem)] sm:py-8"
      >
        <header>
          <h1 className="font-bold text-3xl text-white">Pro Access</h1>
          <p className="mt-2 text-cyan-100/70">Purchase 30 days of personal AI access or upgrade an owned workspace.</p>
        </header>
      </TechFrameCard>
      <SubscriptionPageController data={data} checkoutReturn={checkoutReturn} checkoutPurchaseId={checkoutPurchaseId} />
    </div>
  )
}
