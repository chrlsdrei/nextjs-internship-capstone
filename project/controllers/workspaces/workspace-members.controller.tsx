"use client"

import { useActionState } from "react"
import { WorkspaceMembers } from "@/components/workspaces/workspace-members"
import { createWorkspaceInvitationAction } from "@/features/invitations/actions/create-workspace-invitation"
import { resendInvitationAction } from "@/features/invitations/actions/resend-invitation"
import { revokeInvitationAction } from "@/features/invitations/actions/revoke-invitation"
import type { InvitationDto } from "@/features/invitations/invitation.types"
import { removeWorkspaceMemberAction } from "@/features/workspaces/actions/remove-workspace-member"
import { transferWorkspaceOwnershipAction } from "@/features/workspaces/actions/transfer-workspace-ownership"
import { updateWorkspaceMemberRoleAction } from "@/features/workspaces/actions/update-workspace-member-role"
import type { WorkspaceDetailDto } from "@/features/workspaces/workspace.types"
import { initialActionState } from "@/lib/action-state"

import { LeaveWorkspaceController } from "./leave-workspace.controller"

export function WorkspaceMembersController({
  workspace,
  invitations,
}: {
  workspace: WorkspaceDetailDto
  invitations: InvitationDto[]
}) {
  const [createState, createAction, creating] = useActionState(createWorkspaceInvitationAction, initialActionState)
  const [resendState, resendAction, resending] = useActionState(resendInvitationAction, initialActionState)
  const [revokeState, revokeAction, revoking] = useActionState(revokeInvitationAction, initialActionState)
  const [roleState, roleAction, updatingRole] = useActionState(updateWorkspaceMemberRoleAction, initialActionState)
  const [removeState, removeAction, removing] = useActionState(removeWorkspaceMemberAction, initialActionState)
  const [transferState, transferAction, transferring] = useActionState(
    transferWorkspaceOwnershipAction,
    initialActionState,
  )

  return (
    <WorkspaceMembers
      workspace={workspace}
      invitations={invitations}
      createInvitation={{ action: createAction, pending: creating, state: createState }}
      resendInvitation={{ action: resendAction, pending: resending, state: resendState }}
      revokeInvitation={{ action: revokeAction, pending: revoking, state: revokeState }}
      updateRole={{ action: roleAction, pending: updatingRole, state: roleState }}
      removeMember={{ action: removeAction, pending: removing, state: removeState }}
      transferOwnership={{ action: transferAction, pending: transferring, state: transferState }}
      leaveWorkspaceControl={
        workspace.capabilities.canLeaveWorkspace ? (
          <LeaveWorkspaceController workspaceId={workspace.id} workspaceName={workspace.name} />
        ) : undefined
      }
    />
  )
}
