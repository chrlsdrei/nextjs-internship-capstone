import { ArrowRight, Building2, Plus } from "lucide-react"
import Link from "next/link"

import { TechFrameCard } from "@/components/ui/tech-frame-card"
import { WorkspaceEmptyState } from "@/components/workspaces/workspace-empty-state"
import { WorkspaceRoleBadge } from "@/components/workspaces/workspace-role-badge"
import type { WorkspaceSummaryDto } from "@/features/workspaces/workspace.types"

export function WorkspaceDashboardPanel({ workspaces }: { workspaces: WorkspaceSummaryDto[] }) {
  if (workspaces.length === 0) return <WorkspaceEmptyState compact />

  return (
    <TechFrameCard
      className="min-h-0 w-full"
      contentClassName="min-h-0 gap-0 px-8 py-9 sm:min-h-0 sm:px-[clamp(2.75rem,5vw,6rem)] sm:py-10"
    >
      <section>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold text-lg text-white">Your workspaces</h2>
            <p className="mt-1 text-cyan-100/70 text-xs leading-relaxed sm:text-sm">
              Choose a workspace to view its members and settings.
            </p>
          </div>
          <Link
            href="/workspaces/new"
            aria-label="Create workspace"
            className="shrink-0 rounded-lg p-2 text-cyan-300 hover:bg-cyan-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <Plus size={20} />
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {workspaces.slice(0, 6).map((workspace) => (
            <Link
              key={workspace.id}
              href={`/workspaces/${workspace.id}`}
              className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 rounded-lg border border-cyan-300/25 bg-blue-950/45 p-3 text-white transition-colors hover:border-cyan-300/55 hover:bg-blue-900/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:p-4"
            >
              <Building2 className="row-span-2 shrink-0 text-cyan-300" size={18} />
              <span className="min-w-0 truncate font-medium text-sm sm:text-base" title={workspace.name}>
                {workspace.name}
              </span>
              <ArrowRight className="shrink-0" size={15} />
              <span className="col-span-2 col-start-2 flex min-w-0 flex-wrap items-center justify-between gap-2">
                <span className="text-cyan-100/65 text-xs">
                  {workspace.memberCount} {workspace.memberCount === 1 ? "member" : "members"}
                </span>
                <WorkspaceRoleBadge role={workspace.role} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </TechFrameCard>
  )
}
