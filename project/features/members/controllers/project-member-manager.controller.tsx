"use client"

import { useActionState } from "react"

import { addProjectMemberAction } from "@/features/members/actions/member.actions"
import { ProjectMemberManager } from "@/features/members/components/project-member-manager"
import type { ProjectManagementDto } from "@/features/members/member.types"
import {
  deleteProjectAction,
  updateProjectAction,
  updateProjectSettingsAction,
} from "@/features/projects/actions/project.actions"
import { initialActionState } from "@/lib/action-state"

export function ProjectMemberManagerController(data: ProjectManagementDto) {
  const [settingsState, settingsAction, savingSettings] = useActionState(updateProjectAction, initialActionState)
  const [rulesState, rulesAction, savingRules] = useActionState(updateProjectSettingsAction, initialActionState)
  const [addState, addAction, addingMember] = useActionState(addProjectMemberAction, initialActionState)
  const [deleteState, deleteAction, deleting] = useActionState(deleteProjectAction, initialActionState)

  return (
    <ProjectMemberManager
      {...data}
      updateProject={{ action: settingsAction, pending: savingSettings, state: settingsState }}
      updateRules={{ action: rulesAction, pending: savingRules, state: rulesState }}
      addMember={{ action: addAction, pending: addingMember, state: addState }}
      deleteProject={{ action: deleteAction, pending: deleting, state: deleteState }}
    />
  )
}
