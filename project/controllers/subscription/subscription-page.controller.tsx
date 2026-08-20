"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { SubscriptionAccessCard } from "@/components/subscription/subscription-access-card"
import { CheckoutController } from "@/controllers/subscription/checkout.controller"
import type {
  CheckoutPurchaseDto,
  SubscriptionAccessSummaryDto,
  SubscriptionPageDto,
} from "@/features/billing/billing.types"

export type CheckoutReturnState = "success" | "cancelled" | null

function formatAccessEnd(value: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" }).format(new Date(value))
}

function accessStatus(access: SubscriptionAccessSummaryDto) {
  const end = formatAccessEnd(access.periodEndsAt)
  if (access.tier === "pro") {
    return {
      label: access.proAccessSource === "purchase" ? "Active purchased Pro" : "Active manually assigned Pro",
      detail: end ? `Access is available through ${end}.` : "Pro access is active.",
    }
  }
  if (access.proExpired) {
    return {
      label: "Pro access expired",
      detail: end
        ? `The previous Pro period ended on ${end}. Free access is now active.`
        : "Free access is now active.",
    }
  }
  return { label: "Free access", detail: "Upgrade at any time with a one-time 30-day purchase." }
}

function purchaseStatusMessage(purchase: CheckoutPurchaseDto | null) {
  if (!purchase) return null
  switch (purchase.status) {
    case "pending":
      return "A checkout is awaiting payment or verified webhook confirmation."
    case "failed":
      return "The previous checkout failed. No access was granted, and you may safely try again."
    case "cancelled":
      return "The previous checkout was cancelled. No access was granted."
    case "expired":
      return "The previous checkout expired before payment was confirmed. You may start a new checkout."
    default:
      return null
  }
}

export function SubscriptionPageController({
  data,
  checkoutReturn,
  checkoutPurchaseId,
}: {
  data: SubscriptionPageDto
  checkoutReturn: CheckoutReturnState
  checkoutPurchaseId: string | null
}) {
  const router = useRouter()
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(data.ownedWorkspaces[0]?.id ?? "")
  const [confirmationTimedOut, setConfirmationTimedOut] = useState(false)
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
  const returnedPurchase = useMemo(
    () =>
      checkoutPurchaseId
        ? ([data.user.latestPurchase, ...data.ownedWorkspaces.map((workspace) => workspace.latestPurchase)].find(
            (purchase) => purchase?.id === checkoutPurchaseId,
          ) ?? null)
        : null,
    [checkoutPurchaseId, data.ownedWorkspaces, data.user.latestPurchase],
  )
  const userStatus = accessStatus(data.user)
  const workspaceStatus = selectedWorkspace ? accessStatus(selectedWorkspace) : null
  const cancelledPurchaseId = checkoutReturn === "cancelled" ? checkoutPurchaseId : null
  const userCheckoutPending =
    data.user.latestPurchase?.status === "pending" && data.user.latestPurchase.id !== cancelledPurchaseId
  const workspaceCheckoutPending =
    selectedWorkspace?.latestPurchase?.status === "pending" &&
    selectedWorkspace.latestPurchase.id !== cancelledPurchaseId
  const userPurchaseMessage = purchaseStatusMessage(data.user.latestPurchase)
  const workspacePurchaseMessage = purchaseStatusMessage(selectedWorkspace?.latestPurchase ?? null)

  useEffect(() => {
    if (selectedWorkspaceId && data.ownedWorkspaces.some((workspace) => workspace.id === selectedWorkspaceId)) return
    setSelectedWorkspaceId(data.ownedWorkspaces[0]?.id ?? "")
  }, [data.ownedWorkspaces, selectedWorkspaceId])

  useEffect(() => {
    if (checkoutReturn !== "success" || returnedPurchase?.status === "paid") {
      setConfirmationTimedOut(false)
      return
    }
    setConfirmationTimedOut(false)
    let attempts = 0
    router.refresh()
    const interval = window.setInterval(() => {
      attempts += 1
      router.refresh()
      if (attempts >= 8) {
        window.clearInterval(interval)
        setConfirmationTimedOut(true)
      }
    }, 2_500)
    return () => window.clearInterval(interval)
  }, [checkoutReturn, returnedPurchase?.status, router])

  return (
    <div className="space-y-10">
      {!data.checkout.available && (
        <div role="alert" className="rounded-xl border border-red-300/40 bg-red-950/55 px-5 py-4 text-red-100">
          Checkout is unavailable because the PayMongo environment is incomplete or inconsistent. Existing access is
          unaffected. Ask an administrator to verify the test/live keys and catalog products.
        </div>
      )}
      {checkoutReturn === "success" && returnedPurchase?.status !== "paid" && !confirmationTimedOut && (
        <div
          role="status"
          className="rounded-xl border border-cyan-300/40 bg-cyan-950/75 px-5 py-4 text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.16)]"
        >
          You returned from PayMongo. Payment is not considered complete until the verified webhook confirms it;
          ProjectFlow is refreshing your access status now.
        </div>
      )}
      {checkoutReturn === "success" && returnedPurchase?.status !== "paid" && confirmationTimedOut && (
        <div role="alert" className="rounded-xl border border-amber-300/35 bg-amber-950/45 px-5 py-4 text-amber-100">
          Payment confirmation is taking longer than expected. Do not purchase again yet. Check the PayMongo payment and
          webhook delivery, then refresh this page. Returning here from checkout is not proof of payment and does not
          grant Pro access.
        </div>
      )}
      {checkoutReturn === "success" && returnedPurchase?.status === "paid" && (
        <div
          role="status"
          className="rounded-xl border border-emerald-300/40 bg-emerald-950/55 px-5 py-4 text-emerald-100"
        >
          Payment confirmed. The verified PayMongo webhook granted the new Pro access period shown below.
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
          <SubscriptionAccessCard
            plan={userFree}
            fallbackTitle="User Free"
            highlighted={data.user.tier === "free"}
            benefits={[
              "Manual project and task creation.",
              "Standard Kanban tools.",
              "Workspace collaboration.",
              "Build with AI and AI Tasks are not included.",
            ]}
            currentAccess={data.user.tier === "free" ? "Current access" : undefined}
          />
          <SubscriptionAccessCard
            plan={userPro}
            fallbackTitle="User Pro"
            highlighted={data.user.tier === "pro"}
            benefits={[
              "Build complete boards with AI.",
              "Generate task breakdowns with AI.",
              "Unlimited showcase AI generation, subject to safety limits.",
              "Workspace AI Summary requires Workspace Pro.",
            ]}
            currentAccess={
              data.user.tier === "pro" ? `Current access${accessEnd ? ` through ${accessEnd}` : ""}` : undefined
            }
            status={{ ...userStatus, purchaseMessage: userPurchaseMessage }}
            checkout={
              <CheckoutController
                plan={userPro}
                subjectName="Your ProjectFlow account"
                label={
                  data.user.tier === "pro"
                    ? "Purchase 30 more days"
                    : data.user.proExpired
                      ? "Restore User Pro"
                      : "Purchase User Pro"
                }
                disabledReason={
                  !data.checkout.available
                    ? "Checkout unavailable"
                    : userCheckoutPending
                      ? "Checkout awaiting confirmation"
                      : userPro
                        ? undefined
                        : `No User Pro product matches the ${data.checkout.mode ?? "current"} environment`
                }
              />
            }
          />
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
          <SubscriptionAccessCard
            plan={workspaceFree}
            fallbackTitle="Workspace Free"
            highlighted={selectedWorkspace?.tier === "free"}
            benefits={[
              `Up to ${workspaceFree?.maxProjects ?? 3} projects.`,
              `Up to ${workspaceFree?.maxMembers ?? 5} members.`,
              "Standard workspace collaboration.",
              "AI Board Summary is not included.",
            ]}
            currentAccess={
              selectedWorkspace?.tier === "free" ? `Current access for ${selectedWorkspace.name}` : undefined
            }
          />
          <SubscriptionAccessCard
            plan={workspacePro}
            fallbackTitle="Workspace Pro"
            highlighted={selectedWorkspace?.tier === "pro"}
            benefits={[
              `Up to ${workspacePro?.maxProjects ?? 50} projects.`,
              `Up to ${workspacePro?.maxMembers ?? 100} members.`,
              "AI Board Summary for authorized project viewers.",
              "Unlimited showcase summaries, subject to safety limits.",
              "Personal Build with AI and AI Tasks require User Pro.",
            ]}
            currentAccess={
              selectedWorkspace?.tier === "pro"
                ? `Current access for ${selectedWorkspace.name}${workspaceAccessEnd ? ` through ${workspaceAccessEnd}` : ""}`
                : undefined
            }
            status={workspaceStatus ? { ...workspaceStatus, purchaseMessage: workspacePurchaseMessage } : undefined}
            checkout={
              <CheckoutController
                plan={selectedWorkspace ? workspacePro : null}
                workspaceId={selectedWorkspace?.id}
                subjectName={selectedWorkspace?.name ?? "No workspace selected"}
                label={
                  selectedWorkspace?.tier === "pro"
                    ? "Purchase 30 more days"
                    : selectedWorkspace?.proExpired
                      ? "Restore Workspace Pro"
                      : "Purchase Workspace Pro"
                }
                disabledReason={
                  !selectedWorkspace
                    ? "Select an owned workspace"
                    : !data.checkout.available
                      ? "Checkout unavailable"
                      : workspaceCheckoutPending
                        ? "Checkout awaiting confirmation"
                        : workspacePro
                          ? undefined
                          : `No Workspace Pro product matches the ${data.checkout.mode ?? "current"} environment`
                }
              />
            }
          />
        </div>
      </section>
    </div>
  )
}
