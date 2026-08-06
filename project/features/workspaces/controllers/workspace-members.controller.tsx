"use client"

import { useActionState } from "react"

import {
  createWorkspaceInvitationAction,
  resendInvitationAction,
  revokeInvitationAction,
} from "@/features/invitations/actions/invitation.actions"
import type { InvitationDto } from "@/features/invitations/invitation.types"
import {
  removeWorkspaceMemberAction,
  transferWorkspaceOwnershipAction,
  updateWorkspaceMemberRoleAction,
} from "@/features/workspaces/actions/workspace.actions"
import { WorkspaceMembers } from "@/features/workspaces/components/workspace-members"
import type { WorkspaceDetailDto } from "@/features/workspaces/workspace.types"
import { initialActionState } from "@/lib/action-state"

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
    />
  )
}
