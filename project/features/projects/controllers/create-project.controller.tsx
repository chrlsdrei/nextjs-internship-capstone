"use client"

import { Plus } from "lucide-react"
import { useActionState, useEffect, useState } from "react"

import { createProjectAction } from "@/features/projects/actions/project.actions"
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog"
import { initialActionState } from "@/lib/action-state"

export function CreateProjectController() {
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
        className="inline-flex items-center rounded-lg bg-blue-munsell-500 px-4 py-2 text-white transition-colors hover:bg-blue-munsell-600"
      >
        <Plus size={20} className="mr-2" />
        New Project
      </button>
      {isOpen && (
        <CreateProjectDialog action={formAction} isPending={isPending} onClose={() => setIsOpen(false)} state={state} />
      )}
    </>
  )
}
