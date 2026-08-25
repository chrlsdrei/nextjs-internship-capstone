"use server"

import { redirect } from "next/navigation"

import { memberActionError, refreshMembershipViews } from "@/features/members/actions/member-action-support"
import { leaveProject } from "@/features/members/services/member.service"
import type { ActionState } from "@/lib/action-state"

export async function leaveProjectAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const projectId = String(formData.get("projectId") ?? "")
  try {
    await leaveProject(projectId)
    refreshMembershipViews(projectId)
  } catch (error) {
    return memberActionError(error)
  }

  redirect("/projects")
}
