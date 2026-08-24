import type { NotificationType } from "@/features/notifications/notification.types"

export type NotificationEmailTemplateInput = {
  recipientName: string
  type: NotificationType
  title: string
  message: string
  actionUrl: string
  createdAt: Date
}

const notificationLabels: Record<NotificationType, string> = {
  workspace_invitation: "Workspace invitation",
  project_invitation: "Board invitation",
  task_assigned: "Task assignment",
  task_comment: "Task comment",
  task_due_soon: "Upcoming deadline",
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }
    return entities[character] ?? character
  })
}

export function buildNotificationActionUrl(appUrl: string, href: string | null) {
  const origin = new URL(appUrl)
  if (origin.protocol !== "http:" && origin.protocol !== "https:") throw new Error("Invalid application URL")
  const safePath = href?.startsWith("/") && !href.startsWith("//") ? href : "/dashboard"
  return new URL(safePath, origin.origin).toString()
}

export function buildNotificationEmail(input: NotificationEmailTemplateInput) {
  const label = notificationLabels[input.type]
  const subject = `[QuestBoard] ${input.title}`
  const text = [
    `Hello ${input.recipientName},`,
    "",
    input.title,
    input.message,
    "",
    `Open QuestBoard: ${input.actionUrl}`,
    "",
    "You can turn optional notification emails on or off from Account settings. In-app notifications will remain available.",
  ].join("\n")
  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#020b1c;color:#eaf8ff;font-family:Inter,Arial,sans-serif;padding:24px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;border:1px solid #19d7ff;background:#071b35;box-shadow:0 0 24px rgba(25,215,255,.2);">
      <tr><td style="height:5px;background:linear-gradient(90deg,#1268ff,#19d7ff,#1268ff);"></td></tr>
      <tr><td style="padding:34px 36px;">
        <p style="margin:0 0 10px;color:#19d7ff;font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">${escapeHtml(label)}</p>
        <h1 style="margin:0 0 16px;color:#fff;font-size:26px;line-height:1.3;">${escapeHtml(input.title)}</h1>
        <p style="margin:0 0 24px;color:#bdd4e8;font-size:16px;line-height:1.65;">${escapeHtml(input.message)}</p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;"><tr><td style="border-radius:4px;background:#16bfe5;"><a href="${escapeHtml(input.actionUrl)}" style="display:inline-block;padding:13px 22px;color:#001827;font-size:15px;font-weight:800;text-decoration:none;">Open QuestBoard</a></td></tr></table>
        <p style="margin:0;color:#8fb8d8;font-size:12px;line-height:1.55;">Optional notification emails can be changed in Account settings. In-app notifications remain available.</p>
      </td></tr>
    </table>
  </body>
</html>`
  return { subject, text, html }
}
