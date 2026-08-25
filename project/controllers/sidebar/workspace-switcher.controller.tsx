"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

import { WorkspaceSwitcher } from "@/components/workspaces/workspace-switcher"
import { setActiveWorkspaceAction } from "@/features/workspaces/actions/set-active-workspace"
import type { WorkspaceSummaryDto } from "@/features/workspaces/workspace.types"

export function WorkspaceSwitcherController({
  activeWorkspace,
  collapsed,
  onNavigate,
  workspaces,
}: {
  activeWorkspace: WorkspaceSummaryDto | null
  collapsed: boolean
  onNavigate: () => void
  workspaces: WorkspaceSummaryDto[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(activeWorkspace?.id ?? null)
  const [pending, startTransition] = useTransition()
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === selectedId) ?? activeWorkspace

  useEffect(() => setSelectedId(activeWorkspace?.id ?? null), [activeWorkspace?.id])

  return (
    <WorkspaceSwitcher
      activeWorkspace={selectedWorkspace}
      collapsed={collapsed}
      open={open}
      pending={pending}
      workspaces={workspaces}
      onNavigate={onNavigate}
      onToggle={() => setOpen((current) => !current)}
      onSelect={(workspaceId) => {
        const previousId = selectedId
        setSelectedId(workspaceId)
        setOpen(false)
        onNavigate()
        startTransition(async () => {
          const result = await setActiveWorkspaceAction(workspaceId)
          if (result.status === "error") {
            setSelectedId(previousId)
            return
          }
          router.refresh()
        })
      }}
    />
  )
}
