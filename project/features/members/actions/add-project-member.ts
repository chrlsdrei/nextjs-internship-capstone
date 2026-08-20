"use server"

import { memberActionError, refreshMembershipViews } from "@/features/members/actions/member-action-support"
import { addProjectMember } from "@/features/members/services/member.service"
import type { ActionState } from "@/lib/action-state"
import { actionSuccess } from "@/lib/action-state"

export async function addProjectMemberAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const projectId = String(formData.get("projectId") ?? "")
    await addProjectMember(projectId, { email: formData.get("email"), role: formData.get("role") })
    refreshMembershipViews(projectId)
    return actionSuccess(undefined, "Member added.")
  } catch (error) {
    return memberActionError(error)
  }
}
