import "server-only"

import { Resend } from "resend"

import {
  buildInvitationAcceptanceUrl,
  buildInvitationEmail,
} from "@/features/invitations/gateways/invitation-email.template"
import { InvitationError } from "@/features/invitations/invitation.error"
import type {
  InvitationBoardRole,
  InvitationKind,
  InvitationWorkspaceRole,
} from "@/features/invitations/invitation.types"

type InvitationEmail = {
  invitationId: string
  deliveryAttempt: number
  recipient: string
  kind: InvitationKind
  workspaceName: string
  projectTitle: string | null
  workspaceRole: InvitationWorkspaceRole | null
  boardRole: InvitationBoardRole | null
  token: string
  expiresAt: Date
}

function requiredEnvironment(name: "RESEND_API_KEY" | "RESEND_FROM_EMAIL" | "NEXT_PUBLIC_APP_URL") {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new InvitationError(`${name} is required to send invitation emails`, "INVITATION_CONFIGURATION", 503)
  }
  return value
}

export async function sendInvitationEmail(input: InvitationEmail) {
  const resend = new Resend(requiredEnvironment("RESEND_API_KEY"))
  const from = requiredEnvironment("RESEND_FROM_EMAIL")
  let invitationUrl: string
  try {
    invitationUrl = buildInvitationAcceptanceUrl(requiredEnvironment("NEXT_PUBLIC_APP_URL"), input.token)
  } catch (error) {
    throw new InvitationError(
      error instanceof Error ? error.message : "NEXT_PUBLIC_APP_URL is invalid",
      "INVITATION_CONFIGURATION",
      503,
    )
  }
  const email = buildInvitationEmail({
    kind: input.kind,
    workspaceName: input.workspaceName,
    projectTitle: input.projectTitle,
    workspaceRole: input.workspaceRole,
    boardRole: input.boardRole,
    invitationUrl,
    expiresAt: input.expiresAt,
  })
  const replyTo = process.env.RESEND_REPLY_TO_EMAIL?.trim()

  const result = await resend.emails.send(
    {
      from,
      to: input.recipient,
      replyTo: replyTo || undefined,
      subject: email.subject,
      text: email.text,
      html: email.html,
      tags: [
        { name: "category", value: "invitation" },
        { name: "invitation_kind", value: input.kind },
      ],
    },
    { idempotencyKey: invitationDeliveryIdempotencyKey(input.invitationId, input.deliveryAttempt) },
  )

  if (result.error) {
    throw new InvitationError(
      "The invitation was saved, but its email could not be sent",
      "INVITATION_DELIVERY_FAILED",
      502,
    )
  }
  if (!result.data?.id) {
    throw new InvitationError("The email provider did not confirm delivery", "INVITATION_DELIVERY_FAILED", 502)
  }
  return result.data.id
}

export function invitationDeliveryIdempotencyKey(invitationId: string, deliveryAttempt: number) {
  return `invitation/${invitationId}/delivery/${deliveryAttempt}`
}
