"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { OrnamentalFrame } from "@/components/ui/ornamental-frame"
import type { BillingPlanDto, SubscriptionPageDto } from "@/features/billing/billing.types"
import { CheckoutController } from "@/features/billing/controllers/checkout.controller"

export type CheckoutReturnState = "success" | "cancelled" | null

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

export function SubscriptionPageController({
  data,
  checkoutReturn,
}: {
  data: SubscriptionPageDto
  checkoutReturn: CheckoutReturnState
}) {
  const router = useRouter()
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(data.ownedWorkspaces[0]?.id ?? "")
  const selectedWorkspace = useMemo(
    () => data.ownedWorkspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null,
    [data.ownedWorkspaces, selectedWorkspaceId],
  )
  const accessEnd = formatAccessEnd(data.user.periodEndsAt)
  const workspaceAccessEnd = formatAccessEnd(selectedWorkspace?.periodEndsAt ?? null)
  const userFree = data.catalog.user.free
  const userPro = data.catalog.user.pro
  const workspaceFree = data.catalog.workspace.free
  const workspacePro = data.catalog.workspace.pro

  useEffect(() => {
    if (selectedWorkspaceId && data.ownedWorkspaces.some((workspace) => workspace.id === selectedWorkspaceId)) return
    setSelectedWorkspaceId(data.ownedWorkspaces[0]?.id ?? "")
  }, [data.ownedWorkspaces, selectedWorkspaceId])

  useEffect(() => {
    if (checkoutReturn !== "success") return
    let attempts = 0
    router.refresh()
    const interval = window.setInterval(() => {
      attempts += 1
      router.refresh()
      if (attempts >= 8) window.clearInterval(interval)
    }, 2_500)
    return () => window.clearInterval(interval)
  }, [checkoutReturn, router])

  return (
    <div className="space-y-10">
      {checkoutReturn === "success" && (
        <div
          role="status"
          className="rounded-xl border border-cyan-300/40 bg-cyan-950/75 px-5 py-4 text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.16)]"
        >
          You returned from PayMongo. Payment is not considered complete until the verified webhook confirms it;
          ProjectFlow is refreshing your access status now.
        </div>
      )}
      {checkoutReturn === "cancelled" && (
        <div role="status" className="rounded-xl border border-amber-300/35 bg-amber-950/45 px-5 py-4 text-amber-100">
          Checkout was cancelled. No Pro access was granted and you may try again whenever you are ready.
        </div>
      )}

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
            <CheckoutController
              plan={userPro}
              subjectName="Your ProjectFlow account"
              label={data.user.tier === "pro" ? "Purchase 30 more days" : "Purchase User Pro"}
              disabledReason={userPro ? undefined : "User Pro is currently unavailable"}
            />
          </OrnamentalFrame>
        </div>
      </section>

      <section aria-labelledby="workspace-access-heading" className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="workspace-access-heading" className="font-bold text-2xl text-white">
              Workspace access
            </h2>
            <p className="mt-1 text-cyan-100/70">
              Upgrade an active workspace you own for higher capacity and AI Board Summary.
            </p>
          </div>
          <label className="grid gap-2 text-cyan-100/75 text-sm" htmlFor="subscription-workspace">
            Workspace to upgrade
            <select
              id="subscription-workspace"
              value={selectedWorkspaceId}
              onChange={(event) => setSelectedWorkspaceId(event.target.value)}
              disabled={data.ownedWorkspaces.length === 0}
              className="min-h-11 min-w-64 rounded-lg border border-cyan-300/35 bg-blue-950 px-4 text-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-50"
            >
              {data.ownedWorkspaces.length === 0 ? (
                <option value="">No active owned workspaces</option>
              ) : (
                data.ownedWorkspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>
        {selectedWorkspace && (
          <p className="text-cyan-100/65 text-sm">
            {selectedWorkspace.name}: {selectedWorkspace.usage.projectCount}/{selectedWorkspace.capacity.maxProjects}{" "}
            projects and {selectedWorkspace.usage.memberCount}/{selectedWorkspace.capacity.maxMembers} members.
          </p>
        )}
        <div className="grid gap-6 lg:grid-cols-2">
          <OrnamentalFrame
            title={workspaceFree?.name ?? "Workspace Free"}
            isHighlighted={selectedWorkspace?.tier === "free"}
            contentClassName="flex h-full flex-col px-8 pb-8 pt-2 sm:px-12"
          >
            <p className="font-bold text-2xl text-white">{formatPrice(workspaceFree)}</p>
            <ul className="mt-5 flex-1 space-y-3 text-cyan-50/85">
              <li>• Up to {workspaceFree?.maxProjects ?? 3} projects.</li>
              <li>• Up to {workspaceFree?.maxMembers ?? 5} members.</li>
              <li>• Standard workspace collaboration.</li>
              <li>• AI Board Summary is not included.</li>
            </ul>
            {selectedWorkspace?.tier === "free" && (
              <p className="mt-6 font-semibold text-cyan-300 text-sm">Current access for {selectedWorkspace.name}</p>
            )}
          </OrnamentalFrame>
          <OrnamentalFrame
            title={workspacePro?.name ?? "Workspace Pro"}
            isHighlighted={selectedWorkspace?.tier === "pro"}
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
            {selectedWorkspace?.tier === "pro" && (
              <p className="mt-6 font-semibold text-cyan-300 text-sm">
                Current access for {selectedWorkspace.name}
                {workspaceAccessEnd ? ` through ${workspaceAccessEnd}` : ""}
              </p>
            )}
            <CheckoutController
              plan={selectedWorkspace ? workspacePro : null}
              workspaceId={selectedWorkspace?.id}
              subjectName={selectedWorkspace?.name ?? "No workspace selected"}
              label={selectedWorkspace?.tier === "pro" ? "Purchase 30 more days" : "Purchase Workspace Pro"}
              disabledReason={
                !selectedWorkspace
                  ? "Select an owned workspace"
                  : workspacePro
                    ? undefined
                    : "Workspace Pro is currently unavailable"
              }
            />
          </OrnamentalFrame>
        </div>
      </section>
    </div>
  )
}
