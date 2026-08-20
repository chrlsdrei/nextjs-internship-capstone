"use client"

import { useActionState } from "react"
import { WorkspaceSettings } from "@/components/workspaces/workspace-settings"
import { updateWorkspaceDetailsAction } from "@/features/workspaces/actions/update-workspace-details"
import { updateWorkspaceSettingsAction } from "@/features/workspaces/actions/update-workspace-settings"
import type { WorkspaceDetailDto } from "@/features/workspaces/workspace.types"
import { initialActionState } from "@/lib/action-state"

export function WorkspaceSettingsController({ workspace }: { workspace: WorkspaceDetailDto }) {
  const [detailsState, detailsAction, detailsPending] = useActionState(updateWorkspaceDetailsAction, initialActionState)
  const [rulesState, rulesAction, rulesPending] = useActionState(updateWorkspaceSettingsAction, initialActionState)

  return (
    <WorkspaceSettings
      workspace={workspace}
      details={{ action: detailsAction, pending: detailsPending, state: detailsState }}
      rules={{ action: rulesAction, pending: rulesPending, state: rulesState }}
    />
  )
}
