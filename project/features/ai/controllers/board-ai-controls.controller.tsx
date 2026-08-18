"use client"

import { ListTodo, ScrollText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { ActionFeedback } from "@/components/ui/action-feedback"
import { Modal } from "@/components/ui/modal"
import { generateBoardSummaryAction, generateTasksAction } from "@/features/ai/actions/ai.actions"
import type { BoardSummaryDto } from "@/features/ai/ai-usage.types"
import type { BillingPlanDto, UserAiEntitlementDto, WorkspaceEntitlementDto } from "@/features/billing/billing.types"
import { SubscriptionUpgradeController } from "@/features/billing/controllers/subscription-upgrade.controller"
import type { BoardListDto } from "@/features/board/board.types"
import { type ActionState, initialActionState } from "@/lib/action-state"

const controlClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-300/40 bg-blue-950/55 px-3 py-2.5 font-medium text-cyan-50 text-sm hover:bg-blue-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"

export function BoardAiControlsController({
  projectId,
  workspaceId,
  lists,
  canEdit,
  userEntitlement,
  workspaceEntitlement,
  initialSummaries,
  userPlan,
  workspacePlan,
}: {
  projectId: string
  workspaceId: string
  lists: BoardListDto[]
  canEdit: boolean
  userEntitlement: UserAiEntitlementDto
  workspaceEntitlement: WorkspaceEntitlementDto
  initialSummaries: BoardSummaryDto[]
  userPlan: BillingPlanDto | null
  workspacePlan: BillingPlanDto | null
}) {
  const router = useRouter()
  const [tasksOpen, setTasksOpen] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [taskState, setTaskState] = useState<ActionState<{ created: number }>>(initialActionState)
  const [summaryState, setSummaryState] = useState<ActionState<BoardSummaryDto>>(initialActionState)
  const [summaries, setSummaries] = useState(initialSummaries)
  const [summaryPage, setSummaryPage] = useState(0)
  const summariesPerPage = 5
  const visibleSummaries = summaries.slice(summaryPage * summariesPerPage, (summaryPage + 1) * summariesPerPage)
  const fieldClass =
    "mt-2 w-full rounded-lg border border-cyan-300/35 bg-blue-950/75 px-3 py-2.5 text-white [color-scheme:dark] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"

  return (
    <>
      {canEdit &&
        (userEntitlement.subscribed ? (
          <button type="button" onClick={() => setTasksOpen(true)} className={controlClass}>
            <ListTodo size={16} /> AI Tasks
          </button>
        ) : (
          <SubscriptionUpgradeController plan={userPlan} label="AI Tasks 🔒" className={controlClass} />
        ))}
      {workspaceEntitlement.subscribed ? (
        <button type="button" onClick={() => setSummaryOpen(true)} className={controlClass}>
          <ScrollText size={16} /> AI Summary
        </button>
      ) : workspaceEntitlement.canManageBilling ? (
        <SubscriptionUpgradeController
          workspaceId={workspaceId}
          plan={workspacePlan}
          label="AI Summary 🔒"
          className={controlClass}
        />
      ) : (
        <button
          type="button"
          disabled
          title="Ask the workspace owner to upgrade"
          className={`${controlClass} cursor-not-allowed opacity-55`}
        >
          <ScrollText size={16} /> AI Summary 🔒
        </button>
      )}

      <Modal
        open={tasksOpen}
        onClose={() => setTasksOpen(false)}
        title="Generate AI tasks"
        description="Create up to five title-and-description tasks in one column."
      >
        <form
          className="space-y-4"
          action={(formData) =>
            startTransition(async () => {
              const result = await generateTasksAction({
                projectId,
                listId: formData.get("listId"),
                goal: formData.get("goal"),
                taskCount: formData.get("taskCount"),
                idempotencyKey: crypto.randomUUID(),
              })
              setTaskState(result)
              if (result.status === "success") {
                router.refresh()
              }
            })
          }
        >
          <label className="block font-medium text-sm">
            Project goal
            <textarea name="goal" required minLength={10} maxLength={4000} rows={5} className={fieldClass} />
          </label>
          <label className="block font-medium text-sm">
            Number of tasks
            <select name="taskCount" defaultValue="3" className={fieldClass}>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="block font-medium text-sm">
            Destination column
            <select name="listId" required defaultValue="" className={fieldClass}>
              <option value="" disabled>
                Select a column
              </option>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </label>
          <p className="text-cyan-100/60 text-xs">Pro includes unlimited AI task generation.</p>
          <ActionFeedback state={taskState} />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pending || lists.length === 0}
              className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-blue-950 disabled:opacity-50"
            >
              {pending ? "Generating…" : "Generate tasks"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        title="AI Summarize Board"
        description="Uses the current board and the previous seven days of activity."
        className="max-w-3xl"
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-cyan-100/65 text-sm">Workspace Pro includes unlimited AI board summaries.</p>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await generateBoardSummaryAction({ projectId, idempotencyKey: crypto.randomUUID() })
                  setSummaryState(result)
                  if (result.status === "success" && result.data) {
                    const created = result.data
                    setSummaries((current) => [created, ...current])
                    setSummaryPage(0)
                  }
                })
              }
              className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-blue-950 disabled:opacity-50"
            >
              {pending ? "Summarizing…" : "Summarize this project with AI"}
            </button>
          </div>
          <ActionFeedback state={summaryState} />
          {summaries.length === 0 ? (
            <p className="rounded-lg border border-dashed border-cyan-300/30 p-5 text-cyan-100/65">No summaries yet.</p>
          ) : (
            visibleSummaries.map((summary) => (
              <article key={summary.id} className="space-y-3 rounded-xl border border-cyan-300/25 bg-blue-950/55 p-4">
                <div className="flex justify-between gap-4">
                  <h3 className="font-semibold text-white">Board summary</h3>
                  <time className="text-cyan-100/55 text-xs">{new Date(summary.createdAt).toLocaleString()}</time>
                </div>
                <p>{summary.executiveSummary}</p>
                <div>
                  <h4 className="font-semibold text-cyan-200">Progress</h4>
                  <p className="text-cyan-50/85">{summary.progress}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-cyan-200">Deadline risks</h4>
                  <p className="text-cyan-50/85">{summary.deadlineRisks}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-cyan-200">Unassigned work</h4>
                  <p className="text-cyan-50/85">{summary.unassignedWork}</p>
                </div>
                {summary.suggestedActions.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-cyan-50/85">
                    {[...new Set(summary.suggestedActions)].map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))
          )}
          {summaries.length > summariesPerPage && (
            <div className="flex items-center justify-between border-cyan-300/20 border-t pt-4 text-sm">
              <button
                type="button"
                disabled={summaryPage === 0}
                onClick={() => setSummaryPage((page) => Math.max(0, page - 1))}
                className="rounded-lg border border-cyan-300/30 px-3 py-2 disabled:opacity-40"
              >
                Newer
              </button>
              <span className="text-cyan-100/65">Page {summaryPage + 1}</span>
              <button
                type="button"
                disabled={(summaryPage + 1) * summariesPerPage >= summaries.length}
                onClick={() => setSummaryPage((page) => page + 1)}
                className="rounded-lg border border-cyan-300/30 px-3 py-2 disabled:opacity-40"
              >
                Older
              </button>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
