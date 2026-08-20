"use client"

import { useActionState } from "react"
import { MemberRow } from "@/components/projects/members/member-row"
import { removeProjectMemberAction } from "@/features/members/actions/remove-project-member"
import { updateProjectMemberRoleAction } from "@/features/members/actions/update-project-member-role"
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
