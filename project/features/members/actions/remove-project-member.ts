"use server"

import { memberActionError, refreshMembershipViews } from "@/features/members/actions/member-action-support"
import { removeProjectMember } from "@/features/members/services/member.service"
import type { ActionState } from "@/lib/action-state"
import { actionSuccess } from "@/lib/action-state"

export async function removeProjectMemberAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const projectId = String(formData.get("projectId") ?? "")
    await removeProjectMember(projectId, String(formData.get("memberId") ?? ""))
    refreshMembershipViews(projectId)
    return actionSuccess(undefined, "Member removed.")
  } catch (error) {
    return memberActionError(error)
  }
}
