import { OrnamentalFrame } from "@/components/ui/ornamental-frame"
import { RealisticFogBackground } from "@/components/ui/realistic-fog-background"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import type { BillingPlanDto, SubscriptionPageDto } from "@/features/billing/billing.types"
import { getSubscriptionPageData } from "@/features/billing/server/subscription-page.service"

function formatAccessEnd(value: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" }).format(new Date(value))
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

function SubscriptionPlanSections({ data }: { data: SubscriptionPageDto }) {
  const accessEnd = formatAccessEnd(data.user.periodEndsAt)
  const userFree = data.catalog.user.free
  const userPro = data.catalog.user.pro
  const workspaceFree = data.catalog.workspace.free
  const workspacePro = data.catalog.workspace.pro

  return (
    <div className="space-y-10">
      <section aria-labelledby="user-access-heading" className="space-y-4">
        <div>
          <h2 id="user-access-heading" className="font-bold text-2xl text-white">
            User access
          </h2>
          <p className="mt-1 text-cyan-100/70">
            Personal Pro unlocks AI board and task generation wherever you already have permission.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <OrnamentalFrame
            title={userFree?.name ?? "User Free"}
            isHighlighted={data.user.tier === "free"}
            contentClassName="flex h-full flex-col px-8 pb-8 pt-2 sm:px-12"
          >
            <p className="font-bold text-2xl text-white">{formatPrice(userFree)}</p>
            <ul className="mt-5 flex-1 space-y-3 text-cyan-50/85">
              <li>• Manual project and task creation.</li>
              <li>• Standard Kanban tools.</li>
              <li>• Workspace collaboration.</li>
              <li>• Build with AI and AI Tasks are not included.</li>
            </ul>
            {data.user.tier === "free" && <p className="mt-6 font-semibold text-cyan-300 text-sm">Current access</p>}
          </OrnamentalFrame>
          <OrnamentalFrame
            title={userPro?.name ?? "User Pro"}
            isHighlighted={data.user.tier === "pro"}
            contentClassName="flex h-full flex-col px-8 pb-8 pt-2 sm:px-12"
          >
            <p className="font-bold text-2xl text-white">{formatPrice(userPro)}</p>
            <ul className="mt-5 flex-1 space-y-3 text-cyan-50/85">
              <li>• Build complete boards with AI.</li>
              <li>• Generate task breakdowns with AI.</li>
              <li>• Unlimited showcase AI generation, subject to safety limits.</li>
              <li>• Workspace AI Summary requires Workspace Pro.</li>
            </ul>
            {data.user.tier === "pro" && (
              <p className="mt-6 font-semibold text-cyan-300 text-sm">
                Current access{accessEnd ? ` through ${accessEnd}` : ""}
              </p>
            )}
          </OrnamentalFrame>
        </div>
      </section>

      <section aria-labelledby="workspace-access-heading" className="space-y-4">
        <div>
          <h2 id="workspace-access-heading" className="font-bold text-2xl text-white">
            Workspace access
          </h2>
          <p className="mt-1 text-cyan-100/70">
            Upgrade one of your {data.ownedWorkspaces.length} active owned workspace
            {data.ownedWorkspaces.length === 1 ? "" : "s"} for higher capacity and AI Board Summary.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <OrnamentalFrame
            title={workspaceFree?.name ?? "Workspace Free"}
            contentClassName="flex h-full flex-col px-8 pb-8 pt-2 sm:px-12"
          >
            <p className="font-bold text-2xl text-white">{formatPrice(workspaceFree)}</p>
            <ul className="mt-5 flex-1 space-y-3 text-cyan-50/85">
              <li>• Up to {workspaceFree?.maxProjects ?? 3} projects.</li>
              <li>• Up to {workspaceFree?.maxMembers ?? 5} members.</li>
              <li>• Standard workspace collaboration.</li>
              <li>• AI Board Summary is not included.</li>
            </ul>
          </OrnamentalFrame>
          <OrnamentalFrame
            title={workspacePro?.name ?? "Workspace Pro"}
            contentClassName="flex h-full flex-col px-8 pb-8 pt-2 sm:px-12"
          >
            <p className="font-bold text-2xl text-white">{formatPrice(workspacePro)}</p>
            <ul className="mt-5 flex-1 space-y-3 text-cyan-50/85">
              <li>• Up to {workspacePro?.maxProjects ?? 50} projects.</li>
              <li>• Up to {workspacePro?.maxMembers ?? 100} members.</li>
              <li>• AI Board Summary for authorized project viewers.</li>
              <li>• Unlimited showcase summaries, subject to safety limits.</li>
              <li>• Personal Build with AI and AI Tasks require User Pro.</li>
            </ul>
          </OrnamentalFrame>
        </div>
      </section>
    </div>
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
        <SubscriptionPlanSections data={data} />
      </div>
    </div>
  )
}
