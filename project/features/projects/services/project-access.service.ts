import "server-only"

import { getCurrentDatabaseUser } from "@/features/auth/services/session.service"
import { findProjectAccess } from "@/features/members/repositories/member.repository"
import { ProjectAccessError } from "@/features/projects/project.error"
import type { BoardRole } from "@/features/projects/project.types"

export type ProjectPermission = "view" | "edit" | "manage" | "delete"

const permissions: Record<BoardRole, readonly ProjectPermission[]> = {
  board_admin: ["view", "edit", "manage", "delete"],
  editor: ["view", "edit"],
  viewer: ["view"],
}

export async function getCurrentProjectAccess(projectId: string) {
  const user = await getCurrentDatabaseUser()
  const membership = await findProjectAccess(projectId, user.id)
  return membership ? { ...membership, user } : null
}

export async function requireProjectPermission(projectId: string, permission: ProjectPermission) {
  const access = await getCurrentProjectAccess(projectId)
  if (!access || !permissions[access.role].includes(permission)) {
    throw new ProjectAccessError("You do not have permission to access this project")
  }
  return access
}
