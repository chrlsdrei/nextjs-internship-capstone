import type {
  InvitationBoardRole,
  InvitationKind,
  InvitationWorkspaceRole,
} from "@/features/invitations/invitation.types"

export type InvitationEmailTemplateInput = {
  kind: InvitationKind
  workspaceName: string
  projectTitle: string | null
  workspaceRole: InvitationWorkspaceRole | null
  boardRole: InvitationBoardRole | null
  invitationUrl: string
  expiresAt: Date
}

const workspaceRoleLabels: Record<InvitationWorkspaceRole, string> = {
  admin: "Workspace administrator",
  member: "Workspace member",
}

const boardRoleLabels: Record<InvitationBoardRole, string> = {
  board_admin: "Board administrator",
  editor: "Board editor",
  viewer: "Board viewer",
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }
    return entities[character] ?? character
  })
}

function invitationRole(input: InvitationEmailTemplateInput) {
  const roles = [
    input.workspaceRole ? workspaceRoleLabels[input.workspaceRole] : null,
    input.boardRole ? boardRoleLabels[input.boardRole] : null,
  ].filter(Boolean)
  return roles.join(" and ") || (input.kind === "workspace" ? "Workspace member" : "Board viewer")
}

function expiryLabel(expiresAt: Date) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(expiresAt)
}

export function buildInvitationAcceptanceUrl(appUrl: string, token: string) {
  let origin: URL
  try {
    origin = new URL(appUrl)
  } catch {
    throw new Error("NEXT_PUBLIC_APP_URL must be a valid absolute URL")
  }
  if (origin.protocol !== "http:" && origin.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_APP_URL must use HTTP or HTTPS")
  }
  const invitationUrl = new URL("/invitations/accept", origin.origin)
  invitationUrl.searchParams.set("token", token)
  return invitationUrl.toString()
}

export function buildInvitationEmail(input: InvitationEmailTemplateInput) {
  const projectContext = input.projectTitle ? `, including the ${input.projectTitle} board` : ""
  const destination = `${input.workspaceName}${projectContext}`
  const role = invitationRole(input)
  const expires = expiryLabel(input.expiresAt)
  const subject = input.projectTitle
    ? `Invitation to ${input.projectTitle} in ${input.workspaceName}`
    : `Invitation to join ${input.workspaceName}`
  const text = [
    "You're invited to QuestBoard.",
    "",
    `You have been invited to ${destination}.`,
    `Access: ${role}`,
    `Accept invitation: ${input.invitationUrl}`,
    `This single-use invitation expires ${expires}.`,
    "",
    "For your security, sign in with the same verified email address that received this invitation. If you were not expecting this email, you can safely ignore it.",
  ].join("\n")

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#020b1c;color:#eaf8ff;font-family:Inter,Arial,sans-serif;padding:24px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;border:1px solid #19d7ff;background:#071b35;box-shadow:0 0 24px rgba(25,215,255,.2);">
      <tr><td style="height:5px;background:linear-gradient(90deg,#1268ff,#19d7ff,#1268ff);"></td></tr>
      <tr>
        <td style="padding:34px 36px;">
          <p style="margin:0 0 10px;color:#19d7ff;font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">QuestBoard invitation</p>
          <h1 style="margin:0 0 18px;color:#ffffff;font-size:28px;line-height:1.25;">Join ${escapeHtml(input.workspaceName)}</h1>
          <p style="margin:0 0 20px;color:#bdd4e8;font-size:16px;line-height:1.65;">You have been invited to <strong style="color:#ffffff;">${escapeHtml(destination)}</strong>.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;border:1px solid #174d78;background:#041329;">
            <tr><td style="padding:14px 16px;color:#8fb8d8;font-size:13px;">Access</td><td style="padding:14px 16px;color:#ffffff;font-size:14px;font-weight:700;text-align:right;">${escapeHtml(role)}</td></tr>
          </table>
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
            <tr><td style="border-radius:4px;background:#16bfe5;"><a href="${escapeHtml(input.invitationUrl)}" style="display:inline-block;padding:13px 22px;color:#001827;font-size:15px;font-weight:800;text-decoration:none;">Accept invitation</a></td></tr>
          </table>
          <p style="margin:0 0 8px;color:#8fb8d8;font-size:13px;line-height:1.55;">This single-use invitation expires ${escapeHtml(expires)}.</p>
          <p style="margin:0;color:#8fb8d8;font-size:13px;line-height:1.55;">Sign in with the same verified email address that received this invitation. If you were not expecting it, you can safely ignore this email.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { subject, text, html }
}
