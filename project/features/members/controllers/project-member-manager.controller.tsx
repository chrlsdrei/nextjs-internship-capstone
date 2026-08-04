"use client"

import { useActionState } from "react"

import { addProjectMemberAction, transferProjectOwnershipAction } from "@/features/members/actions/member.actions"
import { ProjectMemberManager } from "@/features/members/components/project-member-manager"
import type { ProjectManagementDto } from "@/features/members/member.types"
import { deleteProjectAction, updateProjectAction } from "@/features/projects/actions/project.actions"
import { initialActionState } from "@/lib/action-state"

export function ProjectMemberManagerController(data: ProjectManagementDto) {
  const [settingsState, settingsAction, savingSettings] = useActionState(updateProjectAction, initialActionState)
  const [addState, addAction, addingMember] = useActionState(addProjectMemberAction, initialActionState)
  const [transferState, transferAction, transferring] = useActionState(
    transferProjectOwnershipAction,
    initialActionState,
  )
  const [deleteState, deleteAction, deleting] = useActionState(deleteProjectAction, initialActionState)

  return (
    <ProjectMemberManager
      {...data}
      updateProject={{ action: settingsAction, pending: savingSettings, state: settingsState }}
      addMember={{ action: addAction, pending: addingMember, state: addState }}
      transferOwnership={{ action: transferAction, pending: transferring, state: transferState }}
      deleteProject={{ action: deleteAction, pending: deleting, state: deleteState }}
    />
  )
}
