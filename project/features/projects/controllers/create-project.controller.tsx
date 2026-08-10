"use client"

import { Plus } from "lucide-react"
import { useActionState, useEffect, useState } from "react"

import { createProjectAction } from "@/features/projects/actions/project.actions"
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog"
import type { WorkspaceSummaryDto } from "@/features/workspaces/workspace.types"
import { initialActionState } from "@/lib/action-state"

export function CreateProjectController({ workspaces }: { workspaces: WorkspaceSummaryDto[] }) {
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
        disabled={workspaces.length === 0}
        title={workspaces.length === 0 ? "You need permission to create projects in an active workspace" : undefined}
        className="inline-flex items-center rounded-lg bg-blue-munsell-500 px-4 py-2 text-white transition-colors hover:bg-blue-munsell-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus size={20} className="mr-2" />
        New Project
      </button>
      {isOpen && (
        <CreateProjectDialog
          action={formAction}
          isPending={isPending}
          onClose={() => setIsOpen(false)}
          state={state}
          workspaces={workspaces}
        />
      )}
    </>
  )
}
