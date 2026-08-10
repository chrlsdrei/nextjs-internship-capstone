import type { WorkspaceRole } from "@/features/workspaces/workspace.types"

export function WorkspaceRoleBadge({ role }: { role: WorkspaceRole }) {
  return (
    <span className="rounded-full bg-blue-munsell-100 px-2.5 py-1 font-medium text-blue-munsell-700 text-xs capitalize dark:bg-blue-munsell-900 dark:text-blue-munsell-300">
      {role}
    </span>
  )
}
