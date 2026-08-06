import { ArrowRight, Users } from "lucide-react"
import Link from "next/link"

import type { WorkspaceSummaryDto } from "@/features/workspaces/workspace.types"

import { WorkspaceRoleBadge } from "./workspace-role-badge"

export function WorkspaceCard({ workspace }: { workspace: WorkspaceSummaryDto }) {
  return (
    <article className="rounded-xl border border-french-gray-300 bg-white p-6 transition-shadow hover:shadow-lg dark:border-paynes-gray-400 dark:bg-outer-space-500">
      <div className="flex items-start justify-between gap-4">
        <WorkspaceRoleBadge role={workspace.role} />
        {workspace.status !== "active" && (
          <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs text-yellow-800 capitalize dark:bg-yellow-900/30 dark:text-yellow-200">
            {workspace.status}
          </span>
        )}
      </div>
      <h2 className="mt-4 font-semibold text-outer-space-500 text-xl dark:text-platinum-500">{workspace.name}</h2>
      <p className="mt-2 min-h-10 text-paynes-gray-500 text-sm dark:text-french-gray-400">
        {workspace.description || "No description yet."}
      </p>
      <div className="mt-5 flex items-center justify-between gap-4 text-paynes-gray-500 text-sm dark:text-french-gray-400">
        <span className="inline-flex items-center gap-2">
          <Users size={16} /> {workspace.memberCount} {workspace.memberCount === 1 ? "member" : "members"}
        </span>
        <Link
          href={`/workspaces/${workspace.id}`}
          className="inline-flex items-center gap-1 font-medium text-blue-munsell-600 hover:text-blue-munsell-700 dark:text-blue-munsell-400"
        >
          Open <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  )
}
