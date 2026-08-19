import { RealisticFogBackground } from "@/components/ui/realistic-fog-background"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import {
  type CheckoutReturnState,
  SubscriptionPageController,
} from "@/features/billing/controllers/subscription-page.controller"
import { getSubscriptionPageData } from "@/features/billing/server/subscription-page.service"

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string | string[] }>
}) {
  const [data, query] = await Promise.all([getSubscriptionPageData(), searchParams])
  const checkoutReturn: CheckoutReturnState =
    query.checkout === "success" || query.checkout === "cancelled" ? query.checkout : null

  return (
    <div className="relative isolate -mx-4 -my-8 min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-8 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <RealisticFogBackground />
      <div className="relative z-10 space-y-6">
        <TechFrameCard
          className="min-h-0 w-full"
          contentClassName="min-h-0 gap-0 px-[clamp(2.5rem,5vw,6rem)] py-6 sm:min-h-0 sm:px-[clamp(2.5rem,5vw,6rem)] sm:py-8"
        >
          <header>
            <h1 className="font-bold text-3xl text-white">Pro Access</h1>
            <p className="mt-2 text-cyan-100/70">
              Purchase 30 days of personal AI access or upgrade an owned workspace.
            </p>
          </header>
        </TechFrameCard>
        <SubscriptionPageController data={data} checkoutReturn={checkoutReturn} />
      </div>
    </div>
  )
}
