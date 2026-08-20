import "server-only"

import { Resend } from "resend"

import { InvitationError } from "@/features/invitations/invitation.error"

type InvitationEmail = {
  invitationId: string
  deliveryAttempt: number
  recipient: string
  workspaceName: string
  projectTitle: string | null
  token: string
}

function requiredEnvironment(name: "RESEND_API_KEY" | "RESEND_FROM_EMAIL" | "NEXT_PUBLIC_APP_URL") {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new InvitationError(`${name} is required to send invitation emails`, "INVITATION_CONFIGURATION", 503)
  }
  return value
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }
    return entities[character] ?? character
  })
}

export async function sendInvitationEmail(input: InvitationEmail) {
  const resend = new Resend(requiredEnvironment("RESEND_API_KEY"))
  const from = requiredEnvironment("RESEND_FROM_EMAIL")
  const appUrl = requiredEnvironment("NEXT_PUBLIC_APP_URL").replace(/\/$/, "")
  const invitationUrl = `${appUrl}/invitations/accept?token=${encodeURIComponent(input.token)}`
  const destination = input.projectTitle
    ? `${input.workspaceName} and its project ${input.projectTitle}`
    : input.workspaceName

  const result = await resend.emails.send(
    {
      from,
      to: input.recipient,
      subject: `You are invited to ${input.workspaceName}`,
      text: `You have been invited to ${destination}. Accept the invitation: ${invitationUrl}`,
      html: `<p>You have been invited to <strong>${escapeHtml(destination)}</strong>.</p><p><a href="${escapeHtml(invitationUrl)}">Accept invitation</a></p>`,
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
