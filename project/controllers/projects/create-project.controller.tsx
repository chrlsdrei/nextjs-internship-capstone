"use client"

import { Plus } from "lucide-react"
import { useActionState, useEffect, useState } from "react"
import { CreateProjectDialog } from "@/components/modals/projects/create-project-dialog"
import { createProjectAction } from "@/features/projects/actions/create-project"
import type { WorkspaceSummaryDto } from "@/features/workspaces/workspace.types"
import { initialActionState } from "@/lib/action-state"

export function CreateProjectController({ workspace }: { workspace: WorkspaceSummaryDto | null }) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(createProjectAction, initialActionState)

  useEffect(() => {
    if (state.status === "success") setIsOpen(false)
  }, [state.status])

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={!workspace}
        title={!workspace ? "You need permission to create projects in the active workspace" : undefined}
        className="inline-flex items-center rounded-lg bg-blue-munsell-500 px-4 py-2 text-white transition-colors hover:bg-blue-munsell-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus size={20} className="mr-2" />
        New Project
      </button>
      {isOpen && workspace && (
        <CreateProjectDialog
          action={formAction}
          isPending={isPending}
          onClose={() => setIsOpen(false)}
          state={state}
          workspace={workspace}
        />
      )}
    </>
  )
}
