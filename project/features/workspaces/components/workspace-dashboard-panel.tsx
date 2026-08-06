import { ArrowRight, Building2, Plus } from "lucide-react"
import Link from "next/link"

import type { WorkspaceSummaryDto } from "@/features/workspaces/workspace.types"

import { WorkspaceEmptyState } from "./workspace-empty-state"
import { WorkspaceRoleBadge } from "./workspace-role-badge"

export function WorkspaceDashboardPanel({ workspaces }: { workspaces: WorkspaceSummaryDto[] }) {
  if (workspaces.length === 0) return <WorkspaceEmptyState compact />

  return (
    <section className="rounded-xl border border-french-gray-300 bg-white p-6 dark:border-paynes-gray-400 dark:bg-outer-space-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-lg text-outer-space-500 dark:text-platinum-500">Your workspaces</h2>
          <p className="mt-1 text-paynes-gray-500 text-sm dark:text-french-gray-400">
            Choose a workspace to view its members and settings.
          </p>
        </div>
        <Link
          href="/workspaces/new"
          aria-label="Create workspace"
          className="rounded-lg p-2 text-blue-munsell-600 hover:bg-platinum-500 dark:text-blue-munsell-400 dark:hover:bg-paynes-gray-400"
        >
          <Plus size={20} />
        </Link>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {workspaces.slice(0, 6).map((workspace) => (
          <Link
            key={workspace.id}
            href={`/workspaces/${workspace.id}`}
            className="flex items-center gap-3 rounded-lg border border-french-gray-300 p-4 hover:bg-platinum-800 dark:border-paynes-gray-400 dark:hover:bg-outer-space-400"
          >
            <Building2 className="shrink-0 text-blue-munsell-500" size={20} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{workspace.name}</span>
              <span className="mt-1 block text-paynes-gray-500 text-xs dark:text-french-gray-400">
                {workspace.memberCount} {workspace.memberCount === 1 ? "member" : "members"}
              </span>
            </span>
            <WorkspaceRoleBadge role={workspace.role} />
            <ArrowRight className="shrink-0" size={16} />
          </Link>
        ))}
      </div>
    </section>
  )
}
