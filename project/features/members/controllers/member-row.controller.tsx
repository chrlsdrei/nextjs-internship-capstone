"use client"

import { useActionState } from "react"

import { removeProjectMemberAction, updateProjectMemberRoleAction } from "@/features/members/actions/member.actions"
import { MemberRow } from "@/features/members/components/member-row"
import type { ProjectMemberDto } from "@/features/members/member.types"
import { initialActionState } from "@/lib/action-state"

export function MemberRowController({ member, projectId }: { member: ProjectMemberDto; projectId: string }) {
  const [roleState, roleAction, rolePending] = useActionState(updateProjectMemberRoleAction, initialActionState)
  const [removeState, removeAction, removePending] = useActionState(removeProjectMemberAction, initialActionState)

  return (
    <MemberRow
      member={member}
      projectId={projectId}
      roleAction={roleAction}
      rolePending={rolePending}
      roleState={roleState}
      removeAction={removeAction}
      removePending={removePending}
      removeState={removeState}
    />
  )
}
