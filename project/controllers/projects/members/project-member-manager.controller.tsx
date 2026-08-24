"use client"

import { useActionState } from "react"
import { ProjectMemberManager } from "@/components/projects/members/project-member-manager"
import { MemberRowController } from "@/controllers/projects/members/member-row.controller"
import { createProjectInvitationAction } from "@/features/invitations/actions/create-project-invitation"
import { resendInvitationAction } from "@/features/invitations/actions/resend-invitation"
import { revokeInvitationAction } from "@/features/invitations/actions/revoke-invitation"
import type { ProjectManagementDto } from "@/features/members/member.types"
import { deleteProjectAction } from "@/features/projects/actions/delete-project"
import { updateProjectAction } from "@/features/projects/actions/update-project"
import { updateProjectSettingsAction } from "@/features/projects/actions/update-project-settings"
import { initialActionState } from "@/lib/action-state"

export function ProjectMemberManagerController(data: ProjectManagementDto) {
  const [settingsState, settingsAction, savingSettings] = useActionState(updateProjectAction, initialActionState)
  const [rulesState, rulesAction, savingRules] = useActionState(updateProjectSettingsAction, initialActionState)
  const [inviteState, inviteAction, invitingMember] = useActionState(createProjectInvitationAction, initialActionState)
  const [resendState, resendAction, resending] = useActionState(resendInvitationAction, initialActionState)
  const [revokeState, revokeAction, revoking] = useActionState(revokeInvitationAction, initialActionState)
  const [deleteState, deleteAction, deleting] = useActionState(deleteProjectAction, initialActionState)

  return (
    <ProjectMemberManager
      {...data}
      renderMember={(member) => <MemberRowController projectId={data.project.id} member={member} />}
      updateProject={{ action: settingsAction, pending: savingSettings, state: settingsState }}
      updateRules={{ action: rulesAction, pending: savingRules, state: rulesState }}
      inviteMember={{ action: inviteAction, pending: invitingMember, state: inviteState }}
      resendInvitation={{ action: resendAction, pending: resending, state: resendState }}
      revokeInvitation={{ action: revokeAction, pending: revoking, state: revokeState }}
      deleteProject={{ action: deleteAction, pending: deleting, state: deleteState }}
    />
  )
}
