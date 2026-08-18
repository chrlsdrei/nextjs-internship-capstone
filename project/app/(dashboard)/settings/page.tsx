import { RealisticFogBackground } from "@/components/ui/realistic-fog-background"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import { BillingPanelController } from "@/features/billing/controllers/billing-panel.controller"
import { getAccountBilling } from "@/features/billing/server/billing.service"

export default async function SettingsPage() {
  const billing = await getAccountBilling()

  return (
    <div className="relative isolate min-h-full overflow-hidden p-4 sm:p-6">
      <RealisticFogBackground />
      <div className="relative z-10 mx-auto max-w-6xl space-y-6">
        <TechFrameCard contentClassName="px-10 py-9 sm:px-14">
          <h1 className="font-bold text-3xl text-white">Account settings</h1>
          <p className="mt-2 text-cyan-100/70">Manage your personal AI subscription and account preferences.</p>
        </TechFrameCard>
        <BillingPanelController
          title="User AI plan"
          description="Unlock Build with AI and AI Tasks across workspaces where you already have permission."
          plans={billing.plans}
          subscription={billing.subscription}
        />
      </div>
    </div>
  )
}
