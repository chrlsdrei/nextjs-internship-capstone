"use client"

import { useActionState } from "react"

import {
  updateWorkspaceDetailsAction,
  updateWorkspaceSettingsAction,
} from "@/features/workspaces/actions/workspace.actions"
import { WorkspaceSettings } from "@/features/workspaces/components/workspace-settings"
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
