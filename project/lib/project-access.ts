import "server-only"

import { and, eq, type SQL, sql } from "drizzle-orm"

import { getCurrentDatabaseUser } from "@/lib/auth"

import { db } from "./db"
import { projectMembers } from "./db/schema"

export type ProjectPermission = "view" | "manage" | "delete" | "transfer"
export type ProjectRole = "owner" | "admin" | "member"

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
  const [membership] = await db
    .select({ projectId: projectMembers.projectId, role: projectMembers.role })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id)))
    .limit(1)

  return membership ? { ...membership, user } : null
}

export async function requireProjectPermission(projectId: string, permission: ProjectPermission) {
  const access = await getCurrentProjectAccess(projectId)
  if (!access || !permissions[access.role].includes(permission)) {
    throw new ProjectAccessError("You do not have permission to access this project")
  }

  return access
}

/**
 * Neon HTTP batches run in one transaction. The advisory lock is deliberately a
 * separate first command so the mutation receives a fresh READ COMMITTED snapshot
 * after waiting for a prior project write. All callers retain authorization checks
 * in the second command itself.
 */
export async function executeProjectLockedWrite<T extends Record<string, unknown>>(projectId: string, mutation: SQL) {
  const [, result] = await db.batch([
    db.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`project-write:${projectId}`}, 0))`),
    db.execute<T>(mutation),
  ])
  return result.rows
}
