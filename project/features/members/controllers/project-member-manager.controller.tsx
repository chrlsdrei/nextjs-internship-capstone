"use client"

import { useActionState } from "react"

import {
  createProjectInvitationAction,
  createWorkspaceInvitationAction,
  resendInvitationAction,
  revokeInvitationAction,
} from "@/features/invitations/actions/invitation.actions"
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
  const [inviteState, inviteAction, invitingMember] = useActionState(createProjectInvitationAction, initialActionState)
  const [outsiderState, outsiderAction, invitingOutsider] = useActionState(
    createWorkspaceInvitationAction,
    initialActionState,
  )
  const [resendState, resendAction, resending] = useActionState(resendInvitationAction, initialActionState)
  const [revokeState, revokeAction, revoking] = useActionState(revokeInvitationAction, initialActionState)
  const [deleteState, deleteAction, deleting] = useActionState(deleteProjectAction, initialActionState)

  return (
    <ProjectMemberManager
      {...data}
      updateProject={{ action: settingsAction, pending: savingSettings, state: settingsState }}
      updateRules={{ action: rulesAction, pending: savingRules, state: rulesState }}
      inviteMember={{ action: inviteAction, pending: invitingMember, state: inviteState }}
      inviteOutsider={{ action: outsiderAction, pending: invitingOutsider, state: outsiderState }}
      resendInvitation={{ action: resendAction, pending: resending, state: resendState }}
      revokeInvitation={{ action: revokeAction, pending: revoking, state: revokeState }}
      deleteProject={{ action: deleteAction, pending: deleting, state: deleteState }}
    />
  )
}
