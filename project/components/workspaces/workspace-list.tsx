import type { WorkspaceSummaryDto } from "@/features/workspaces/workspace.types"

import { WorkspaceCard } from "./workspace-card"
import { WorkspaceEmptyState } from "./workspace-empty-state"

export function WorkspaceList({ workspaces }: { workspaces: WorkspaceSummaryDto[] }) {
  if (workspaces.length === 0) return <WorkspaceEmptyState />

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {workspaces.map((workspace) => (
        <WorkspaceCard key={workspace.id} workspace={workspace} />
      ))}
    </div>
  )
}
