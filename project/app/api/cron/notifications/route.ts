import { NextResponse } from "next/server"

import { processScheduledNotificationEmails } from "@/features/notifications/services/notification.service"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (!cronSecret) return NextResponse.json({ error: "Notification cron is not configured" }, { status: 503 })
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await processScheduledNotificationEmails()
    return NextResponse.json({ processed: true, ...result })
  } catch (error) {
    console.error("Scheduled notification email processing failed", error)
    return NextResponse.json({ error: "Notification processing failed" }, { status: 500 })
  }
}
