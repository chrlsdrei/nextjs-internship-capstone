"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { generateBoardAction } from "@/features/ai/actions/ai.actions"
import { BuildAiDialog } from "@/features/ai/components/build-ai-dialog"
import type { BillingPlanDto, UserAiEntitlementDto } from "@/features/billing/billing.types"
import { SubscriptionUpgradeController } from "@/features/billing/controllers/subscription-upgrade.controller"
import { type ActionState, initialActionState } from "@/lib/action-state"

export function BuildAiController({
  collapsed,
  entitlement,
  workspaces,
  plan,
}: {
  collapsed: boolean
  entitlement: UserAiEntitlementDto
  workspaces: Array<{ id: string; name: string }>
  plan: BillingPlanDto | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<ActionState<{ projectId: string }>>(initialActionState)
  const buttonClass = `flex w-full items-center rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 font-semibold text-cyan-100 hover:bg-cyan-300/20 ${collapsed ? "lg:justify-center lg:px-2" : ""}`

  if (!entitlement.subscribed) {
    return (
      <SubscriptionUpgradeController
        plan={plan}
        label="Build with AI 🔒"
        icon={<Image src="/Quest-Board-av.png" alt="" width={24} height={24} className="mr-2" />}
        labelClassName={collapsed ? "lg:sr-only" : undefined}
        className={buttonClass}
      />
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={workspaces.length === 0}
        className={buttonClass}
        title={workspaces.length ? "Build with AI" : "No workspace permits project creation"}
      >
        <Image
          src="/Quest-Board-av.png"
          alt=""
          width={24}
          height={24}
          className={collapsed ? "mr-2 lg:mr-0" : "mr-2"}
        />
        <span className={collapsed ? "lg:sr-only" : undefined}>Build with AI</span>
      </button>
      <BuildAiDialog
        open={open}
        onClose={() => setOpen(false)}
        pending={pending}
        state={state}
        workspaces={workspaces}
        onSubmit={(formData) =>
          startTransition(async () => {
            const result = await generateBoardAction({
              workspaceId: formData.get("workspaceId"),
              title: formData.get("title"),
              goal: formData.get("goal"),
              listCount: formData.get("listCount"),
              taskCount: formData.get("taskCount"),
              dueDate: formData.get("dueDate"),
              idempotencyKey: crypto.randomUUID(),
            })
            setState(result)
            if (result.status === "success" && result.data) router.push(`/projects/${result.data.projectId}`)
          })
        }
      />
    </>
  )
}
