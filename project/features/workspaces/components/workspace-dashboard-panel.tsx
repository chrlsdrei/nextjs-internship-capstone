import { ArrowRight, Building2, Plus } from "lucide-react"
import Link from "next/link"

import { TechFrameCard } from "@/components/ui/tech-frame-card"
import type { WorkspaceSummaryDto } from "@/features/workspaces/workspace.types"

import { WorkspaceEmptyState } from "./workspace-empty-state"
import { WorkspaceRoleBadge } from "./workspace-role-badge"

export function WorkspaceDashboardPanel({ workspaces }: { workspaces: WorkspaceSummaryDto[] }) {
  if (workspaces.length === 0) return <WorkspaceEmptyState compact />

  return (
    <TechFrameCard
      className="min-h-0 w-full"
      contentClassName="min-h-0 gap-0 px-[clamp(2.75rem,5vw,6rem)] py-8 sm:min-h-0 sm:px-[clamp(2.75rem,5vw,6rem)] sm:py-10"
    >
      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-lg text-white">Your workspaces</h2>
            <p className="mt-1 text-cyan-100/70 text-sm">Choose a workspace to view its members and settings.</p>
          </div>
          <Link
            href="/workspaces/new"
            aria-label="Create workspace"
            className="rounded-lg p-2 text-cyan-300 hover:bg-cyan-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <Plus size={20} />
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {workspaces.slice(0, 6).map((workspace) => (
            <Link
              key={workspace.id}
              href={`/workspaces/${workspace.id}`}
              className="flex items-center gap-3 rounded-lg border border-cyan-300/25 bg-blue-950/45 p-4 text-white transition-colors hover:border-cyan-300/55 hover:bg-blue-900/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <Building2 className="shrink-0 text-cyan-300" size={20} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{workspace.name}</span>
                <span className="mt-1 block text-cyan-100/65 text-xs">
                  {workspace.memberCount} {workspace.memberCount === 1 ? "member" : "members"}
                </span>
              </span>
              <WorkspaceRoleBadge role={workspace.role} />
              <ArrowRight className="shrink-0" size={16} />
            </Link>
          ))}
        </div>
      </section>
    </TechFrameCard>
  )
}
