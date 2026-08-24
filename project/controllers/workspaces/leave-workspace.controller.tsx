"use client"

import { LogOut } from "lucide-react"
import { useActionState, useState } from "react"

import { LeaveWorkspaceDialog } from "@/components/modals/workspaces/leave-workspace-dialog"
import { leaveWorkspaceAction } from "@/features/workspaces/actions/leave-workspace"
import { initialActionState } from "@/lib/action-state"

export function LeaveWorkspaceController({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string
  workspaceName: string
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(leaveWorkspaceAction, initialActionState)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-400/45 bg-red-950/30 px-3 py-2.5 font-medium text-red-200 text-sm hover:bg-red-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
      >
        <LogOut size={16} /> Leave workspace
      </button>
      {open && (
        <LeaveWorkspaceDialog
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          action={action}
          pending={pending}
          state={state}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
