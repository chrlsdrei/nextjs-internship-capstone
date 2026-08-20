"use server"

import { memberActionError, refreshMembershipViews } from "@/features/members/actions/member-action-support"
import { updateProjectMemberRole } from "@/features/members/services/member.service"
import type { ActionState } from "@/lib/action-state"
import { actionSuccess } from "@/lib/action-state"

export async function updateProjectMemberRoleAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const projectId = String(formData.get("projectId") ?? "")
    await updateProjectMemberRole(projectId, String(formData.get("memberId") ?? ""), {
      role: formData.get("role"),
    })
    refreshMembershipViews(projectId)
    return actionSuccess(undefined, "Saved.")
  } catch (error) {
    return memberActionError(error)
  }
}
