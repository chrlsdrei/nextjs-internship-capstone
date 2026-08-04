import "server-only"

import { getCurrentDatabaseUser } from "@/features/auth/server/session.service"
import { findProjectAccess } from "@/features/members/server/member.repository"
import type { ProjectRole } from "@/features/projects/project.types"

export type ProjectPermission = "view" | "manage" | "delete" | "transfer"

export class ProjectAccessError extends Error {
  constructor(
    message: string,
    public readonly status = 403,
  ) {
    super(message)
    this.name = "ProjectAccessError"
  }
}

const permissions: Record<ProjectRole, readonly ProjectPermission[]> = {
  owner: ["view", "manage", "delete", "transfer"],
  admin: ["view", "manage"],
  member: ["view"],
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
