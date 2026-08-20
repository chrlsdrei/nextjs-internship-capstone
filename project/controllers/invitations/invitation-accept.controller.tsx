"use client"

import { useRouter } from "next/navigation"
import { useActionState, useEffect } from "react"
import { InvitationAcceptView } from "@/components/invitations/invitation-accept-view"
import { acceptInvitationAction } from "@/features/invitations/actions/accept-invitation"
import type { InvitationAcceptanceDto, InvitationPreviewDto } from "@/features/invitations/invitation.types"
import type { ActionState } from "@/lib/action-state"

const initialState: ActionState<InvitationAcceptanceDto> = { status: "idle" }

export function InvitationAcceptController({
  preview,
  token,
  signedIn,
  signInHref,
  signUpHref,
}: {
  preview: InvitationPreviewDto
  token: string
  signedIn: boolean
  signInHref: string
  signUpHref: string
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(acceptInvitationAction, initialState)

  useEffect(() => {
    if (state.status !== "success" || !state.data) return
    router.replace(state.data.projectId ? `/projects/${state.data.projectId}` : `/workspaces/${state.data.workspaceId}`)
  }, [router, state])

  return (
    <InvitationAcceptView
      preview={preview}
      token={token}
      signedIn={signedIn}
      signInHref={signInHref}
      signUpHref={signUpHref}
      accept={{ action, pending, state }}
    />
  )
}
