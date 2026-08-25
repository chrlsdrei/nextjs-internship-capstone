import "server-only"

import { getCurrentDatabaseUser } from "@/features/auth/services/session.service"
import type { TeamPresenceDto } from "@/features/presence/presence.types"
import { listPresenceByUserIds, touchUserPresence } from "@/features/presence/repositories/presence.repository"
import {
  listActiveWorkspaceMembers,
  listActiveWorkspaceMemberships,
} from "@/features/workspaces/repositories/workspace.repository"

export async function recordCurrentUserPresence() {
  const user = await getCurrentDatabaseUser()
  await touchUserPresence(user.id)
}

export async function refreshAccessibleTeamPresence(workspaceId?: string): Promise<TeamPresenceDto[]> {
  const user = await getCurrentDatabaseUser()
  await touchUserPresence(user.id)

  const memberships = (await listActiveWorkspaceMemberships(user.id)).filter(
    (workspace) => !workspaceId || workspace.id === workspaceId,
  )
  const workspaceMembers = await Promise.all(memberships.map((workspace) => listActiveWorkspaceMembers(workspace.id)))
  const userIds = [...new Set(workspaceMembers.flat().map((member) => member.userId))]
  const presence = await listPresenceByUserIds(userIds)
  const presenceByUserId = new Map(presence.map((record) => [record.userId, record.lastSeenAt]))

  return userIds.map((userId) => ({
    userId,
    lastSeenAt: presenceByUserId.get(userId)?.toISOString() ?? null,
  }))
}
