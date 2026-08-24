"use server"

import { refreshAccessibleTeamPresence } from "@/features/presence/services/presence.service"

export async function refreshTeamPresenceAction() {
  return refreshAccessibleTeamPresence()
}
