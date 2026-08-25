export const ACTIVE_WORKSPACE_COOKIE = "questboard_active_workspace"

export const ACTIVE_WORKSPACE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export function resolveActiveWorkspace<T extends { id: string }>(workspaces: T[], requestedId?: string) {
  return workspaces.find((workspace) => workspace.id === requestedId) ?? workspaces[0] ?? null
}
