"use server"

import { recordCurrentUserPresence } from "@/features/presence/services/presence.service"

export async function recordPresenceAction() {
  await recordCurrentUserPresence()
}
