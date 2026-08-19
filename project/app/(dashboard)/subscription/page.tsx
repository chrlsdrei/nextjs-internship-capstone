import { RealisticFogBackground } from "@/components/ui/realistic-fog-background"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import type { SubscriptionPageDto } from "@/features/billing/billing.types"
import { getSubscriptionPageData } from "@/features/billing/server/subscription-page.service"

function formatAccessEnd(value: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" }).format(new Date(value))
}

function SubscriptionAccessSnapshot({ data }: { data: SubscriptionPageDto }) {
  const accessEnd = formatAccessEnd(data.user.periodEndsAt)

  return (
    <section aria-labelledby="current-access-heading" className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-cyan-300/25 bg-blue-950/65 p-5 shadow-[inset_0_0_24px_rgba(34,211,238,0.08)]">
        <p className="text-cyan-100/65 text-sm">Personal access</p>
        <h2 id="current-access-heading" className="mt-1 font-bold text-2xl text-white capitalize">
          {data.user.tier}
        </h2>
        <p className="mt-2 text-cyan-100/70 text-sm">
          {accessEnd ? `Available through ${accessEnd}.` : "Standard ProjectFlow access."}
        </p>
      </div>
      <div className="rounded-xl border border-cyan-300/25 bg-blue-950/65 p-5 shadow-[inset_0_0_24px_rgba(34,211,238,0.08)]">
        <p className="text-cyan-100/65 text-sm">Owned workspaces eligible for upgrade</p>
        <p className="mt-1 font-bold text-2xl text-white">{data.ownedWorkspaces.length}</p>
        <p className="mt-2 text-cyan-100/70 text-sm">
          Free and Pro access options will be shown for active catalog products.
        </p>
      </div>
    </section>
  )
}

export default async function SubscriptionPage() {
  const data = await getSubscriptionPageData()

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
        <SubscriptionAccessSnapshot data={data} />
      </div>
    </div>
  )
}
