import "server-only"

import { Resend } from "resend"

import {
  buildNotificationActionUrl,
  buildNotificationEmail,
} from "@/features/notifications/gateways/notification-email.template"
import type { NotificationType } from "@/features/notifications/notification.types"

export type NotificationEmailInput = {
  notificationId: string
  recipientEmail: string
  recipientName: string
  type: NotificationType
  title: string
  message: string
  href: string | null
  createdAt: Date
}

function requiredEnvironment(name: "RESEND_API_KEY" | "RESEND_FROM_EMAIL" | "NEXT_PUBLIC_APP_URL") {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required to send notification emails`)
  return value
}

export async function sendNotificationEmail(input: NotificationEmailInput) {
  const resend = new Resend(requiredEnvironment("RESEND_API_KEY"))
  const actionUrl = buildNotificationActionUrl(requiredEnvironment("NEXT_PUBLIC_APP_URL"), input.href)
  const email = buildNotificationEmail({
    recipientName: input.recipientName,
    type: input.type,
    title: input.title,
    message: input.message,
    actionUrl,
    createdAt: input.createdAt,
  })
  const result = await resend.emails.send(
    {
      from: requiredEnvironment("RESEND_FROM_EMAIL"),
      to: input.recipientEmail,
      replyTo: process.env.RESEND_REPLY_TO_EMAIL?.trim() || undefined,
      subject: email.subject,
      text: email.text,
      html: email.html,
      tags: [
        { name: "category", value: "notification" },
        { name: "notification_type", value: input.type },
      ],
    },
    { idempotencyKey: `notification/${input.notificationId}` },
  )
  if (result.error) throw new Error(result.error.name || "RESEND_DELIVERY_FAILED")
  if (!result.data?.id) throw new Error("RESEND_DELIVERY_NOT_CONFIRMED")
  return result.data.id
}
